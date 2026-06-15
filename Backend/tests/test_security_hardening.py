import pytest
from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from google.api_core import exceptions as google_exceptions
from pydantic import ValidationError
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import Settings
from app.core.errors import google_api_exception_handler, http_exception_handler
from app.core.headers import apply_dynamic_cache_headers
from app.core.rate_limit import InMemoryRateLimitMiddleware, RequestSizeLimitMiddleware
from app.docs import testing_docs as render_testing_docs


def test_production_rejects_wildcard_cors():
    with pytest.raises(ValidationError):
        Settings(
            APP_ENV="production",
            CORS_ORIGINS="*",
            FIREBASE_PROJECT_ID="enci-test",
            GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json",
        )


def test_cors_origins_accept_comma_separated_hosting_value():
    settings = Settings(
        CORS_ORIGINS="https://enci.vercel.app, https://preview.vercel.app/",
        FIREBASE_PROJECT_ID="enci-test",
        GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json",
    )

    assert settings.cors_origins_list == [
        "https://enci.vercel.app",
        "https://preview.vercel.app",
    ]


def test_production_rejects_open_cors_regex():
    with pytest.raises(ValidationError):
        Settings(
            APP_ENV="production",
            CORS_ORIGINS="https://enci.cl",
            CORS_ORIGIN_REGEX=".*",
            FIREBASE_PROJECT_ID="enci-test",
            GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json",
        )


def test_production_rejects_enabled_temporary_role_switcher():
    with pytest.raises(ValidationError):
        Settings(
            APP_ENV="production",
            CORS_ORIGINS="https://enci.cl",
            ENABLE_TEMPORARY_ROLE_SWITCHER=True,
            FIREBASE_PROJECT_ID="enci-test",
            GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json",
        )


def test_temporary_role_switcher_is_disabled_by_default():
    settings = Settings(
        _env_file=None,
        FIREBASE_PROJECT_ID="enci-test",
        GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json",
    )

    assert settings.ENABLE_TEMPORARY_ROLE_SWITCHER is False


@pytest.mark.anyio
async def test_rate_limiter_blocks_request_bursts():
    async def app(scope, receive, send):
        response = JSONResponse({"ok": True})
        await response(scope, receive, send)

    middleware = InMemoryRateLimitMiddleware(app, requests_per_minute=2)

    async def call_next(_request):
        return JSONResponse({"ok": True})

    scope = {
        "type": "http",
        "method": "GET",
        "path": "/clientes",
        "headers": [],
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
        "scheme": "http",
        "query_string": b"",
    }

    first = await middleware.dispatch(Request(scope), call_next)
    second = await middleware.dispatch(Request(scope), call_next)
    third = await middleware.dispatch(Request(scope), call_next)

    assert first.status_code == 200
    assert second.status_code == 200
    assert third.status_code == 429


@pytest.mark.anyio
async def test_rate_limiter_cleans_expired_clients():
    async def app(scope, receive, send):
        response = JSONResponse({"ok": True})
        await response(scope, receive, send)

    middleware = InMemoryRateLimitMiddleware(app, max_tracked_clients=1)
    middleware.clients = {
        "old-client": [-120.0],
        "active-client": [11.0],
    }

    middleware._cleanup_expired_clients(now=70.0)

    assert "old-client" not in middleware.clients
    assert "active-client" in middleware.clients


@pytest.mark.anyio
async def test_request_size_limiter_rejects_large_requests():
    async def app(scope, receive, send):
        response = JSONResponse({"ok": True})
        await response(scope, receive, send)

    middleware = RequestSizeLimitMiddleware(app, max_body_bytes=10)

    async def call_next(_request):
        return JSONResponse({"ok": True})

    scope = {
        "type": "http",
        "method": "POST",
        "path": "/clientes",
        "headers": [(b"content-length", b"11")],
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
        "scheme": "http",
        "query_string": b"",
    }

    response = await middleware.dispatch(Request(scope), call_next)

    assert response.status_code == 413


@pytest.mark.anyio
async def test_request_size_limiter_rejects_invalid_content_length():
    async def app(scope, receive, send):
        response = JSONResponse({"ok": True})
        await response(scope, receive, send)

    middleware = RequestSizeLimitMiddleware(app)

    async def call_next(_request):
        return JSONResponse({"ok": True})

    scope = {
        "type": "http",
        "method": "POST",
        "path": "/clientes",
        "headers": [(b"content-length", b"not-a-number")],
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
        "scheme": "http",
        "query_string": b"",
    }

    response = await middleware.dispatch(Request(scope), call_next)

    assert response.status_code == 400


@pytest.mark.anyio
async def test_http_errors_use_standard_contract():
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/clientes/nope",
        "headers": [],
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
        "scheme": "http",
        "query_string": b"",
    }

    response = await http_exception_handler(
        Request(scope),
        HTTPException(status_code=403, detail="Sin permisos"),
    )

    assert response.status_code == 403
    assert response.body
    assert b'"error":"Sin permisos"' in response.body
    assert b'"codigo":"ERR_FORBIDDEN"' in response.body
    assert b'"timestamp"' in response.body


def test_dynamic_api_responses_are_not_cached():
    response = JSONResponse({"ok": True})

    apply_dynamic_cache_headers("/dashboard/vendedor", response.headers)
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["pragma"] == "no-cache"


@pytest.mark.anyio
async def test_firestore_quota_errors_return_controlled_429():
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/auth/login",
        "headers": [],
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
        "scheme": "http",
        "query_string": b"",
    }

    response = await google_api_exception_handler(
        Request(scope),
        google_exceptions.ResourceExhausted("Quota exceeded."),
    )

    assert response.status_code == 429
    assert response.headers["retry-after"] == "60"
    assert b'"codigo":"ERR_FIRESTORE_QUOTA_EXCEEDED"' in response.body
    assert b"Quota exceeded" not in response.body


@pytest.mark.anyio
async def test_validation_errors_do_not_echo_rejected_input():
    from app.core.errors import validation_exception_handler

    scope = {
        "type": "http",
        "method": "POST",
        "path": "/clientes",
        "headers": [],
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
        "scheme": "http",
        "query_string": b"",
    }
    errors = [{
        "loc": ("body", "token"),
        "msg": "Input should be valid",
        "type": "value_error",
        "input": "secret-token-value",
    }]

    class FakeValidationError(RequestValidationError):
        def errors(self):
            return errors

    response = await validation_exception_handler(Request(scope), FakeValidationError([]))

    assert response.status_code == 422
    assert b"secret-token-value" not in response.body


@pytest.mark.anyio
async def test_custom_docs_are_blocked_in_production(monkeypatch):
    monkeypatch.setattr(
        "app.docs.get_settings",
        lambda: Settings(
            APP_ENV="production",
            CORS_ORIGINS="https://enci.cl",
            ENABLE_TEMPORARY_ROLE_SWITCHER=False,
            FIREBASE_PROJECT_ID="enci-test",
            GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json",
        ),
    )

    with pytest.raises(HTTPException) as exc_info:
        await render_testing_docs()

    assert exc_info.value.status_code == 404
