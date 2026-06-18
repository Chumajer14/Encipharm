import { Buffer } from "node:buffer";

const BACKEND_BASE_URL = "https://enci-backend.vercel.app";
const PRODUCTION_ORIGIN = "https://enciapp.vercel.app";
const PREVIEW_ORIGIN_REGEX =
  /^https:\/\/enciapp-[a-z0-9-]+-chumajer14s-projects\.vercel\.app$/;

const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type,X-Enci-Client",
  "Cache-Control": "no-store",
  "Pragma": "no-cache",
};
const BACKEND_TIMEOUT_MS = 25_000;

function resolveAllowedOrigin(origin = "") {
  if (origin === PRODUCTION_ORIGIN || PREVIEW_ORIGIN_REGEX.test(origin)) {
    return origin;
  }
  return PRODUCTION_ORIGIN;
}

function buildHeaders(request) {
  const headers = {};
  for (const [key, value] of Object.entries(request.headers)) {
    const normalizedKey = key.toLowerCase();
    if (["host", "origin", "referer", "connection", "content-length"].includes(normalizedKey)) {
      continue;
    }
    headers[key] = value;
  }
  return headers;
}

function buildProxyError({ backendUrl, error, rawPath, traceId }) {
  const errorName = error?.name || "Error";
  const errorMessage = error?.message || "Error desconocido";
  const isTimeout = errorName === "AbortError" || errorMessage.toLowerCase().includes("aborted");

  return {
    code: isTimeout ? "PROXY_BACKEND_TIMEOUT" : "PROXY_BACKEND_FETCH_FAILED",
    detail: isTimeout
      ? "El proxy de Vercel agoto el tiempo esperando respuesta del backend Render."
      : "El proxy de Vercel no pudo conectar con el backend Render.",
    hint: isTimeout
      ? "Revisa si Render esta arrancando, bloqueado o con cold start superior a 25 segundos."
      : "Revisa disponibilidad de Render, DNS, TLS o variables de entorno del backend.",
    traceId,
    proxy: {
      app: "enciapp",
      method: "FETCH_BACKEND",
      rawPath,
      backendUrl,
      attempts: error?.attempts || 1,
    },
    error: {
      name: errorName,
      message: errorMessage,
      cause: error?.cause?.message || null,
    },
  };
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchBackendWithRetry(backendUrl, request, rawPath, traceId) {
  const maxAttempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

    try {
      return await fetch(backendUrl, {
        method: request.method,
        headers: buildHeaders(request),
        body: ["GET", "HEAD"].includes(request.method) ? undefined : JSON.stringify(request.body || {}),
        signal: controller.signal,
      });
    } catch (error) {
      lastError = error;
      lastError.attempts = attempt;
      console.error("Proxy backend fetch failed", {
        traceId,
        rawPath,
        backendUrl,
        attempt,
        name: error?.name,
        message: error?.message,
        cause: error?.cause?.message,
      });
      if (attempt < maxAttempts) {
        await delay(350 * attempt);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError;
}

export default async function handler(request, response) {
  const traceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  response.setHeader("Access-Control-Allow-Origin", resolveAllowedOrigin(request.headers.origin));
  response.setHeader("X-Enci-Trace-Id", traceId);
  Object.entries(BASE_CORS_HEADERS).forEach(([key, value]) => {
    response.setHeader(key, value);
  });

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  const requestUrl = new URL(request.url, `https://${request.headers.host}`);
  const rawPathFromUrl = requestUrl.pathname.replace(/^\/api\/?/, "");
  const rawPath = Array.isArray(request.query.path)
    ? request.query.path.join("/")
    : request.query.path || rawPathFromUrl;
  const searchParams = requestUrl.searchParams.toString();
  const backendUrl = `${BACKEND_BASE_URL}/${rawPath}${searchParams ? `?${searchParams}` : ""}`;

  try {
    const backendResponse = await fetchBackendWithRetry(backendUrl, request, rawPath, traceId);
    const contentType = backendResponse.headers.get("content-type") || "application/json";
    const body = await backendResponse.arrayBuffer();

    response.status(backendResponse.status);
    response.setHeader("Content-Type", contentType);
    response.setHeader("X-Enci-Upstream-Status", String(backendResponse.status));
    response.setHeader("X-Enci-Upstream-Url", backendUrl);
    response.send(Buffer.from(body));
  } catch (error) {
    response
      .status(error?.name === "AbortError" ? 504 : 502)
      .json(buildProxyError({ backendUrl, error, rawPath, traceId }));
  }
}
