#!/usr/bin/env python
"""Smoke test for the CRM web UAT/go-live gate."""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


@dataclass
class CheckResult:
    name: str
    ok: bool
    detail: str


def _join_url(base_url: str, path: str) -> str:
    return f"{base_url.rstrip('/')}/{path.lstrip('/')}"


def _request_json(url: str, token: str | None = None) -> tuple[int, Any]:
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = Request(url, headers=headers, method="GET")
    with urlopen(request, timeout=15) as response:
        raw_body = response.read().decode("utf-8")
        return response.status, json.loads(raw_body) if raw_body else None


def _request_status(url: str) -> int:
    request = Request(url, headers={"Accept": "text/html,application/json"}, method="GET")
    try:
        with urlopen(request, timeout=15) as response:
            return response.status
    except HTTPError as error:
        return error.code


def check_health(api_base_url: str) -> CheckResult:
    try:
        status, body = _request_json(_join_url(api_base_url, "/health"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
        return CheckResult("health", False, str(error))
    ok = status == 200 and body == {"status": "ok"}
    return CheckResult("health", ok, f"HTTP {status}: {body}")


def check_readiness(api_base_url: str) -> CheckResult:
    try:
        status, body = _request_json(_join_url(api_base_url, "/readiness"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
        return CheckResult("readiness", False, str(error))
    failed = [
        item.get("nombre", "sin_nombre")
        for item in body.get("checks", [])
        if item.get("estado") != "ok"
    ] if isinstance(body, dict) else []
    ok = status == 200 and isinstance(body, dict) and body.get("status") == "ready"
    detail = "ready" if ok else f"HTTP {status}: status={body.get('status') if isinstance(body, dict) else body}; failed={failed}"
    return CheckResult("readiness", ok, detail)


def check_docs(api_base_url: str, env: str) -> CheckResult:
    status = _request_status(_join_url(api_base_url, "/docs"))
    if env == "production":
        ok = status == 404
        detail = "bloqueado en produccion" if ok else f"HTTP {status}; se esperaba 404"
    else:
        ok = status == 200
        detail = "disponible fuera de produccion" if ok else f"HTTP {status}; se esperaba 200"
    return CheckResult("docs", ok, detail)


def check_authenticated_endpoint(api_base_url: str, path: str, token: str) -> CheckResult:
    name = path.strip("/") or "root"
    try:
        status, body = _request_json(_join_url(api_base_url, path), token=token)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
        return CheckResult(name, False, str(error))
    ok = status == 200
    summary = f"{len(body)} registros" if isinstance(body, list) else "respuesta JSON"
    return CheckResult(name, ok, f"HTTP {status}: {summary}")


def check_frontend(web_url: str) -> CheckResult:
    status = _request_status(web_url)
    ok = status == 200
    return CheckResult("frontend", ok, f"HTTP {status}")


def print_result(result: CheckResult) -> None:
    marker = "OK" if result.ok else "FAIL"
    print(f"[{marker}] {result.name}: {result.detail}")


def main() -> int:
    parser = argparse.ArgumentParser(description="CRM web UAT/go-live smoke test.")
    parser.add_argument("--api-base-url", required=True, help="Backend base URL, for example https://api.example.com")
    parser.add_argument("--web-url", help="Frontend URL to verify with HTTP 200.")
    parser.add_argument("--env", choices=["development", "uat", "staging", "production"], default="uat")
    parser.add_argument("--token", help="Firebase ID token for authenticated /me and /clientes checks.")
    args = parser.parse_args()

    checks = [
        check_health(args.api_base_url),
        check_readiness(args.api_base_url),
        check_docs(args.api_base_url, args.env),
    ]
    if args.web_url:
        checks.append(check_frontend(args.web_url))
    if args.token:
        checks.extend([
            check_authenticated_endpoint(args.api_base_url, "/me", args.token),
            check_authenticated_endpoint(args.api_base_url, "/clientes", args.token),
        ])

    for result in checks:
        print_result(result)

    return 0 if all(result.ok for result in checks) else 1


if __name__ == "__main__":
    sys.exit(main())
