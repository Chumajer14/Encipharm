const API_URL = import.meta.env.VITE_API_BASE_URL;
console.log(import.meta.env.VITE_API_BASE_URL);

export async function obtenerClientes() {
  const response = await fetch(`${API_URL}/clientes/`);

  if (!response.ok) {
    throw new Error("Error al obtener clientes");
  }

  return response.json();
}

export async function crearCliente(cliente) {
  const response = await fetch(`${API_URL}/clientes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cliente),
  });

  if (!response.ok) {
    throw new Error("Error al crear cliente");
  }

  return response.json();
}