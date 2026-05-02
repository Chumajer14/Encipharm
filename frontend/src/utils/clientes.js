export function filtrarClientes(clientes, busqueda) {
  const texto = busqueda.trim().toLowerCase();

  if (!texto) {
    return clientes;
  }

  return clientes.filter((cliente) => (
    cliente.nombre.toLowerCase().includes(texto) ||
    cliente.empresa.toLowerCase().includes(texto) ||
    cliente.rubro.toLowerCase().includes(texto) ||
    cliente.region.toLowerCase().includes(texto)
  ));
}
