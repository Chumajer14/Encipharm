const API_URL = import.meta.env.VITE_API_BASE_URL;

export async function getClientes(idToken) {
  const response = await fetch(`${API_URL}/clientes/`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener clientes");
  }

  return response.json();
}

export async function crearCliente(cliente, idToken) {
  const response = await fetch(`${API_URL}/clientes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(cliente),
  });

  if (!response.ok) {
    throw new Error("Error al crear cliente");
  }

  return response.json();
}