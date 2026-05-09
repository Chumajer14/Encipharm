const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function apiFetch(path, { token, ...options } = {}) {
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
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail = Array.isArray(errorBody.detail)
      ? errorBody.detail.map((item) => item.msg).join(" ")
      : errorBody.detail;
    const message = detail || `Error ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export function loginWithBackend(token) {
  return apiFetch("/auth/login", {
    method: "POST",
    token,
  });
}

export function getClientes(token) {
  return apiFetch("/clientes", { token });
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
    throw new Error(errorBody.detail || `Error ${response.status}`);
  }
}


export function getDashboardVendedor(token) {
  return apiFetch("/dashboard/vendedor", { token });
}

export function getDashboardSupervisor(token) {
  return apiFetch("/dashboard/supervisor", { token });
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
  return apiFetch(withQuery("/oportunidades", params), { token });
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
  return apiFetch(withQuery("/propuestas", params), { token });
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

