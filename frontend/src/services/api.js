const DEFAULT_API_BASE_URL = "http://localhost:8000";
const FIREBASE_FREE_TIER_MODE = import.meta.env.VITE_FIREBASE_FREE_TIER_MODE !== "false";
const GET_CACHE_PREFIX = "enci-api-get:";
const DEFAULT_GET_CACHE_TTL_MS = FIREBASE_FREE_TIER_MODE ? 2 * 60 * 1000 : 60 * 1000;
const GET_CACHE_TTL_MS = Number(import.meta.env.VITE_API_GET_CACHE_TTL_MS || DEFAULT_GET_CACHE_TTL_MS);
const getCacheMemory = new Map();

/**
 * Resolves the backend base URL from Vite environment variables.
 * The trailing slash is removed to keep endpoint composition stable in Vercel.
 */
function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    if (hostname.endsWith(".vercel.app") || (protocol === "https:" && !isLocalhost)) {
      return "/api";
    }
  }

  const configuredUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
  return configuredUrl.replace(/\/+$/, "");
}

const API_BASE_URL = getApiBaseUrl();
const CLIENT_PLATFORM = "web";

function getCacheKey(path) {
  return `${GET_CACHE_PREFIX}${path}`;
}

function readGetCache(path) {
  const key = getCacheKey(path);
  const now = Date.now();
  const memoryEntry = getCacheMemory.get(key);
  if (memoryEntry && memoryEntry.expiresAt > now) {
    return memoryEntry.data;
  }

  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw);
    if (!entry || entry.expiresAt <= now) {
      sessionStorage.removeItem(key);
      getCacheMemory.delete(key);
      return undefined;
    }
    getCacheMemory.set(key, entry);
    return entry.data;
  } catch {
    return undefined;
  }
}

function writeGetCache(path, data) {
  const key = getCacheKey(path);
  const entry = {
    data,
    expiresAt: Date.now() + GET_CACHE_TTL_MS,
  };
  getCacheMemory.set(key, entry);
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage can fail in private or quota-limited contexts; memory cache still helps.
  }
}

export function clearApiGetCache() {
  getCacheMemory.clear();
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(GET_CACHE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage cleanup failures.
  }
}

function notifyDataMutated() {
  window.dispatchEvent(new CustomEvent("enci:data-mutated"));
}

export class ApiError extends Error {
  constructor(message, status, details = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = details.code || `API_HTTP_${status || "UNKNOWN"}`;
    this.details = details;
  }
}

function notifyAuthExpired(status) {
  if (status === 401) {
    window.dispatchEvent(new CustomEvent("enci:auth-expired"));
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
      code: "API_ERROR_BODY_NOT_JSON",
      detail: "El servidor respondio con un cuerpo no JSON.",
      raw: text.slice(0, 500),
    };
  }
}

function getErrorDetail(errorBody) {
  if (Array.isArray(errorBody.detail)) {
    return errorBody.detail.map((item) => item.msg || JSON.stringify(item)).join(" ");
  }

  const details = [];
  if (errorBody.detail) details.push(errorBody.detail);
  if (errorBody.message) details.push(errorBody.message);
  if (typeof errorBody.error === "string") details.push(errorBody.error);
  if (errorBody.hint) details.push(`Hint: ${errorBody.hint}`);
  if (errorBody.proxy?.attempts) details.push(`Intentos: ${errorBody.proxy.attempts}`);
  if (errorBody.error && typeof errorBody.error === "object") {
    const proxyError = [errorBody.error.name, errorBody.error.message].filter(Boolean).join(": ");
    if (proxyError) details.push(`ProxyError: ${proxyError}`);
    if (errorBody.error.cause) details.push(`Cause: ${errorBody.error.cause}`);
  }

  return details.join(" | ");
}

export async function apiFetch(path, { token, ...options } = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const canUseGetCache = FIREBASE_FREE_TIER_MODE && method === "GET";
  if (canUseGetCache) {
    const cached = readGetCache(path);
    if (cached !== undefined) {
      return cached;
    }
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Enci-Client": CLIENT_PLATFORM,
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  const url = `${API_BASE_URL}${path}`;

  try {
    response = await fetch(url, {
      ...options,
      headers,
      cache: method === "GET" ? "no-store" : "default",
    });
  } catch (networkError) {
    const code = "API_NETWORK_FETCH_FAILED";
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
    const code = errorBody.code || `API_HTTP_${response.status}`;
    const detail = getErrorDetail(errorBody);
    const message = buildDiagnosticMessage({
      code,
      message: detail || response.statusText || `Error ${response.status}`,
      method,
      path,
      status: response.status,
      traceId,
      upstreamStatus,
    });
    notifyAuthExpired(response.status);
    throw new ApiError(message, response.status, {
      code,
      method,
      path,
      url,
      traceId,
      upstreamStatus,
      body: errorBody,
    });
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    const code = "API_SUCCESS_BODY_NOT_JSON";
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
  if (canUseGetCache) {
    writeGetCache(path, data);
  } else if (method !== "GET") {
    clearApiGetCache();
    notifyDataMutated();
  }

  return data;
}

export function loginWithBackend(token) {
  return apiFetch("/auth/login", {
    method: "POST",
    token,
  });
}

export function updateCurrentUserTemporaryRole(token, rol) {
  return apiFetch("/auth/temporary-role", {
    method: "PATCH",
    token,
    body: JSON.stringify({ rol }),
  });
}

export function updateCurrentUserPreferences(token, preferences) {
  return apiFetch("/users/me/preferences", {
    method: "PATCH",
    token,
    body: JSON.stringify(preferences),
  });
}

export function getClientes(token, params = {}) {
  return apiFetch(withQuery("/clientes", { limit: 500, ...params }), { token });
}

export function getCliente(token, clienteId) {
  return apiFetch(`/clientes/${clienteId}`, { token });
}

export function createCliente(token, cliente) {
  return apiFetch("/clientes", {
    method: "POST",
    token,
    body: JSON.stringify(cliente),
  });
}

export function updateCliente(token, clienteId, cliente) {
  return apiFetch(`/clientes/${clienteId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(cliente),
  });
}

export async function deleteCliente(token, clienteId) {
  const response = await fetch(`${API_BASE_URL}/clientes/${clienteId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    notifyAuthExpired(response.status);
    throw new ApiError(errorBody.detail || errorBody.error || `Error ${response.status}`, response.status);
  }

  clearApiGetCache();
  notifyDataMutated();
}


export function getDashboardVendedor(token) {
  return apiFetch("/dashboard/vendedor", { token });
}

export function getDashboardSupervisor(token) {
  return apiFetch("/dashboard/supervisor", { token });
}

export function getUsers(token, params = {}) {
  return apiFetch(withQuery("/users/", params), { token });
}

export function updateUserRole(token, uid, rol) {
  return apiFetch(`/users/${uid}/role`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ rol }),
  });
}

export function updateUser(token, uid, changes) {
  return apiFetch(`/users/${uid}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(changes),
  });
}

export function updateUserStatus(token, uid, activo) {
  return apiFetch(`/users/${uid}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ activo }),
  });
}

function withQuery(path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export function getInteracciones(token, params = {}) {
  return apiFetch(withQuery("/interacciones", params), { token });
}

export function createInteraccion(token, interaccion) {
  return apiFetch("/interacciones", {
    method: "POST",
    token,
    body: JSON.stringify(interaccion),
  });
}

export function getOportunidades(token, params = {}) {
  return apiFetch(withQuery("/oportunidades", { limit: 500, ...params }), { token });
}

export function getOportunidadDetalle(token, oportunidadId) {
  return apiFetch(`/oportunidades/${oportunidadId}/detalle`, { token });
}

export function createOportunidad(token, oportunidad) {
  return apiFetch("/oportunidades", {
    method: "POST",
    token,
    body: JSON.stringify(oportunidad),
  });
}

export function updateOportunidad(token, oportunidadId, oportunidad) {
  return apiFetch(`/oportunidades/${oportunidadId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(oportunidad),
  });
}

export function getPropuestas(token, params = {}) {
  return apiFetch(withQuery("/propuestas", { limit: 500, ...params }), { token });
}

export function getCompetitionRepository(token) {
  return apiFetch("/competencia/repository", { token });
}

export function sendRagMessage(token, payload) {
  return apiFetch("/rag/chat", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function getRagConversations(token) {
  return apiFetch("/rag/conversations", { token });
}

export function getRagDocuments(token) {
  return apiFetch("/rag/documents", { token });
}

export async function uploadRagDocument(token, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/rag/documents/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Enci-Client": CLIENT_PLATFORM,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    notifyAuthExpired(response.status);
    throw new ApiError(errorBody.detail || errorBody.error || `Error ${response.status}`, response.status);
  }

  clearApiGetCache();
  notifyDataMutated();
  return response.json();
}

export function reindexRagDocuments(token) {
  return apiFetch("/rag/documents/reindex", {
    method: "POST",
    token,
  });
}

export function createPropuesta(token, propuesta) {
  return apiFetch("/propuestas", {
    method: "POST",
    token,
    body: JSON.stringify(propuesta),
  });
}

export function updatePropuesta(token, propuestaId, propuesta) {
  return apiFetch(`/propuestas/${propuestaId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(propuesta),
  });
}

