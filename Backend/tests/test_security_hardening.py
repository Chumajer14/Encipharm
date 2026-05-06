import pytest
from pydantic import ValidationError
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import Settings
from app.core.rate_limit import InMemoryRateLimitMiddleware, RequestSizeLimitMiddleware


def test_production_rejects_wildcard_cors():
    with pytest.raises(ValidationError):
        Settings(
            APP_ENV="production",
            CORS_ORIGINS=["*"],
            FIREBASE_PROJECT_ID="encipharm-test",
            GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json",
        )


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
