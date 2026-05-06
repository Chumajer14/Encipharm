from time import monotonic

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject oversized requests before endpoint parsing."""

    def __init__(self, app, max_body_bytes: int = 1_000_000):
        super().__init__(app)
        self.max_body_bytes = max_body_bytes

    async def dispatch(self, request: Request, call_next) -> Response:
        content_length = request.headers.get("content-length")
        try:
            request_size = int(content_length) if content_length else 0
        except ValueError:
            return JSONResponse(
                status_code=400,
                content={"detail": "Header Content-Length invalido."},
            )

        if request_size > self.max_body_bytes:
            return JSONResponse(
                status_code=413,
                content={"detail": "El request supera el tamano maximo permitido."},
            )

        return await call_next(request)


class InMemoryRateLimitMiddleware(BaseHTTPMiddleware):
    """Limit request bursts per client IP for a single API process."""

    def __init__(self, app, requests_per_minute: int = 120, max_tracked_clients: int = 10_000):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.max_tracked_clients = max_tracked_clients
        self.window_seconds = 60
        self.clients: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method == "OPTIONS" or request.url.path in {"/health"}:
            return await call_next(request)

        now = monotonic()
        client_ip = request.client.host if request.client else "unknown"
        self._cleanup_expired_clients(now)
        timestamps = [
            timestamp
            for timestamp in self.clients.get(client_ip, [])
            if now - timestamp < self.window_seconds
        ]

        if len(timestamps) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={"detail": "Demasiadas solicitudes. Intenta nuevamente en un minuto."},
            )

        timestamps.append(now)
        self.clients[client_ip] = timestamps
        return await call_next(request)

    def _cleanup_expired_clients(self, now: float) -> None:
        if len(self.clients) < self.max_tracked_clients:
            return

        self.clients = {
            client_ip: [
                timestamp
                for timestamp in timestamps
                if now - timestamp < self.window_seconds
            ]
            for client_ip, timestamps in self.clients.items()
        }
        self.clients = {
            client_ip: timestamps
            for client_ip, timestamps in self.clients.items()
            if timestamps
        }
