function ClienteSelect({
  clientes,
  disabled = false,
  loading = false,
  name = "clienteId",
  onChange,
  required = true,
  value,
}) {
  const hasClientes = clientes.length > 0;
  const placeholder = loading
    ? "Cargando..."
    : hasClientes
      ? "Selecciona cliente"
      : "No hay clientes disponibles";

  return (
    <div className="select-loading-wrap">
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled || loading || !hasClientes}
      >
        <option value="">{placeholder}</option>
        {clientes.map((cliente) => (
          <option key={cliente.id} value={cliente.id}>
            {cliente.empresa}
          </option>
        ))}
      </select>
      {loading && <span className="select-spinner" aria-hidden="true" />}
    </div>
  );
}

export default ClienteSelect;
