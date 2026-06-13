const API_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiFetch(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
export function getClientes(token) {
  return apiFetch("/clientes?limit=500", token);
}