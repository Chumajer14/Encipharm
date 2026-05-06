from time import monotonic

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response


class InMemoryRateLimitMiddleware(BaseHTTPMiddleware):
    """Limit request bursts per client IP for a single API process."""

    def __init__(self, app, requests_per_minute: int = 120):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        self.clients: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method == "OPTIONS" or request.url.path in {"/health"}:
            return await call_next(request)

        now = monotonic()
        client_ip = request.client.host if request.client else "unknown"
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
