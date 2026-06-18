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

export async function apiFetch(path, token, options = {}) {
  if (!token) {
    throw new Error("No hay sesion activa para consumir la API.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Enci-Client": CLIENT_PLATFORM,
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Error ${response.status}`);
  }

  return response.json();
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
