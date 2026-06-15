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
  const configuredUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
  return configuredUrl.replace(/\/+$/, "");
}

const API_BASE_URL = getApiBaseUrl();

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
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function notifyAuthExpired(status) {
  if (status === 401) {
    window.dispatchEvent(new CustomEvent("enci:auth-expired"));
  }
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
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: method === "GET" ? "no-store" : "default",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail = Array.isArray(errorBody.detail)
      ? errorBody.detail.map((item) => item.msg).join(" ")
      : errorBody.detail || errorBody.error;
    const message = detail || `Error ${response.status}`;
    notifyAuthExpired(response.status);
    throw new ApiError(message, response.status);
  }

  const data = await response.json();
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

