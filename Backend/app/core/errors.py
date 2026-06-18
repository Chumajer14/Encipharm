from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from google.api_core import exceptions as google_exceptions
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR


ERROR_CODES = {
    400: "ERR_BAD_REQUEST",
    401: "ERR_UNAUTHORIZED",
    403: "ERR_FORBIDDEN",
    404: "ERR_NOT_FOUND",
    409: "ERR_CONFLICT",
    413: "ERR_PAYLOAD_TOO_LARGE",
    422: "ERR_VALIDATION",
    429: "ERR_RATE_LIMIT",
    500: "ERR_INTERNAL",
    503: "ERR_SERVICE_UNAVAILABLE",
}


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def error_payload(
    status_code: int,
    message: Any,
    code: str | None = None,
    details: Any = None,
) -> dict[str, Any]:
    """Build the API-wide error contract expected by client integrations."""
    return {
        "error": message if isinstance(message, str) else "Error de validacion",
        "codigo": code or ERROR_CODES.get(status_code, "ERR_UNEXPECTED"),
        "detalles": details,
        "timestamp": _timestamp(),
    }


async def http_exception_handler(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
    status_code = exc.status_code
    headers = getattr(exc, "headers", None)
    detail = getattr(exc, "detail", None)
    if isinstance(detail, dict):
        return JSONResponse(
            status_code=status_code,
            content=error_payload(
                status_code,
                detail.get("error") or detail.get("detail") or "Error HTTP",
                code=detail.get("codigo") or detail.get("code"),
                details=detail.get("detalles") or detail.get("details"),
            ),
            headers=headers,
        )
    return JSONResponse(
        status_code=status_code,
        content=error_payload(status_code, detail or "Error HTTP"),
        headers=headers,
    )


async def validation_exception_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    safe_details = [
        {
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "type": error.get("type"),
        }
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content=error_payload(
            422,
            "Datos de entrada invalidos",
            details=safe_details,
        ),
    )


async def unhandled_exception_handler(_request: Request, _exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_payload(
            HTTP_500_INTERNAL_SERVER_ERROR,
            "Error interno del servidor",
        ),
    )


async def google_api_exception_handler(_request: Request, exc: google_exceptions.GoogleAPICallError) -> JSONResponse:
    status_code = 503
    message = "Servicio de datos temporalmente no disponible"
    code = "ERR_DATA_SERVICE_UNAVAILABLE"

    if isinstance(exc, google_exceptions.ResourceExhausted):
        status_code = 429
        message = "Cuota de Firestore excedida. Intenta nuevamente mas tarde."
        code = "ERR_FIRESTORE_QUOTA_EXCEEDED"

    return JSONResponse(
        status_code=status_code,
        content=error_payload(status_code, message, code=code),
        headers={"Retry-After": "60"},
    )


__all__ = [
    "HTTPException",
    "http_exception_handler",
    "google_api_exception_handler",
    "validation_exception_handler",
    "unhandled_exception_handler",
]
