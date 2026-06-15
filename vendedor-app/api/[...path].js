import { Buffer } from "node:buffer";

const BACKEND_BASE_URL = "https://encipharm.onrender.com";
const PRODUCTION_ORIGIN = "https://enciapp.vercel.app";
const PREVIEW_ORIGIN_REGEX =
  /^https:\/\/enciapp-[a-z0-9-]+-chumajer14s-projects\.vercel\.app$/;

const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Cache-Control": "no-store",
  "Pragma": "no-cache",
};

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

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", resolveAllowedOrigin(request.headers.origin));
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
    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers: buildHeaders(request),
      body: ["GET", "HEAD"].includes(request.method) ? undefined : JSON.stringify(request.body || {}),
    });
    const contentType = backendResponse.headers.get("content-type") || "application/json";
    const body = await backendResponse.arrayBuffer();

    response.status(backendResponse.status);
    response.setHeader("Content-Type", contentType);
    response.send(Buffer.from(body));
  } catch (error) {
    response.status(502).json({
      detail: "No se pudo conectar con el backend.",
      error: error.message,
    });
  }
}
