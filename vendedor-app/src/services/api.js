const DEFAULT_API_URL = "http://localhost:8000";
const CLIENT_PLATFORM = "mobile";

/**
 * Resolves the backend base URL for local development and Vercel deployments.
 * Production uses the Vercel proxy to avoid exposing backend topology to clients.
 */
function getApiUrl() {
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    if (hostname.endsWith(".vercel.app") || (protocol === "https:" && !isLocalhost)) {
      return "/api";
    }
  }

  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL).replace(/\/+$/, "");
}

const API_URL = getApiUrl();

export class ApiError extends Error {
  constructor(message, status, details = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = details.code || `MOBILE_API_HTTP_${status || "UNKNOWN"}`;
    this.details = details;
  }
}

function buildDiagnosticMessage({ code, message, method, path, status, traceId, upstreamStatus }) {
  const parts = [
    `[${code}]`,
    message,
    `Metodo: ${method}`,
    `Ruta: ${path}`,
  ];

  if (status) parts.push(`HTTP: ${status}`);
  if (upstreamStatus) parts.push(`Backend: ${upstreamStatus}`);
  if (traceId) parts.push(`Trace: ${traceId}`);

  return parts.join(" | ");
}

async function readErrorBody(response) {
  const text = await response.text().catch(() => "");
  if (!text) return { raw: "" };

  try {
    return JSON.parse(text);
  } catch {
    return {
      code: "MOBILE_API_ERROR_BODY_NOT_JSON",
      detail: "El servidor respondio con un cuerpo no JSON.",
      raw: text.slice(0, 500),
    };
  }
}

function getErrorDetail(errorBody) {
  if (Array.isArray(errorBody.detail)) {
    return errorBody.detail.map((item) => item.msg || JSON.stringify(item)).join(" ");
  }

  return errorBody.detail || errorBody.error || errorBody.message;
}

export async function apiFetch(path, token, options = {}) {
  if (!token) {
    throw new ApiError("[MOBILE_API_MISSING_TOKEN] No hay sesion activa para consumir la API.", 0, {
      code: "MOBILE_API_MISSING_TOKEN",
      path,
    });
  }

  const method = String(options.method || "GET").toUpperCase();
  const url = `${API_URL}${path}`;
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Enci-Client": CLIENT_PLATFORM,
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      cache: method === "GET" ? "no-store" : "default",
    });
  } catch (networkError) {
    const code = "MOBILE_API_NETWORK_FETCH_FAILED";
    throw new ApiError(
      buildDiagnosticMessage({
        code,
        message: "El navegador no pudo ejecutar fetch. Posible CORS, DNS, conexion o bloqueo de red.",
        method,
        path,
      }),
      0,
      {
        code,
        method,
        path,
        url,
        errorName: networkError?.name,
        errorMessage: networkError?.message,
      },
    );
  }

  if (!response.ok) {
    const errorBody = await readErrorBody(response);
    const traceId = response.headers.get("X-Enci-Trace-Id") || errorBody.traceId;
    const upstreamStatus = response.headers.get("X-Enci-Upstream-Status");
    const code = errorBody.code || `MOBILE_API_HTTP_${response.status}`;
    const detail = getErrorDetail(errorBody);

    throw new ApiError(
      buildDiagnosticMessage({
        code,
        message: detail || response.statusText || `Error ${response.status}`,
        method,
        path,
        status: response.status,
        traceId,
        upstreamStatus,
      }),
      response.status,
      {
        code,
        method,
        path,
        url,
        traceId,
        upstreamStatus,
        body: errorBody,
      },
    );
  }

  try {
    return await response.json();
  } catch (parseError) {
    const code = "MOBILE_API_SUCCESS_BODY_NOT_JSON";
    throw new ApiError(
      buildDiagnosticMessage({
        code,
        message: "La respuesta fue exitosa, pero no se pudo parsear como JSON.",
        method,
        path,
        status: response.status,
        traceId: response.headers.get("X-Enci-Trace-Id"),
      }),
      response.status,
      {
        code,
        method,
        path,
        url,
        errorMessage: parseError?.message,
      },
    );
  }
}

export function loginBackend(token) {
  return apiFetch("/auth/login", token, {
    method: "POST",
  });
}

export function crearOportunidad(token, oportunidad) {
  return apiFetch("/oportunidades", token, {
    method: "POST",
    body: JSON.stringify(oportunidad),
  });
}

export function actualizarOportunidad(token, oportunidadId, cambios) {
  return apiFetch(`/oportunidades/${oportunidadId}`, token, {
    method: "PATCH",
    body: JSON.stringify(cambios),
  });
}

export function getOportunidades(token) {
  return apiFetch("/oportunidades?limit=500", token);
}

export function getClientes(token) {
  return apiFetch("/clientes?limit=500", token);
}

export function sendRagMessage(token, payload) {
  return apiFetch("/rag/chat", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
