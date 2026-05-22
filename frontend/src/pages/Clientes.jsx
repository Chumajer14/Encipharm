import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import LoadingState from "../components/LoadingState";
import useCachedQuery from "../hooks/useCachedQuery";
import { getClientes } from "../services/api";

function Clientes() {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [clientes, setClientes] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { idToken } = useAuth();
  const clientesQuery = useCachedQuery(
    "clientes:list",
    () => getClientes(idToken),
    { enabled: Boolean(idToken), initialData: [] },
  );
  const loading = clientesQuery.loading;
  const error = clientesQuery.error ? `No se pudieron cargar los clientes: ${clientesQuery.error}` : "";

  useEffect(() => {
    queueMicrotask(() => setClientes(clientesQuery.data || []));
  }, [clientesQuery.data]);

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = busqueda.trim().toLowerCase();
    const matchesEstado = !estado || cliente.estado === estado;

    if (!matchesEstado) {
      return false;
    }

    if (!texto) {
      return true;
    }

    return (
      cliente.nombre?.toLowerCase().includes(texto) ||
      cliente.empresa?.toLowerCase().includes(texto) ||
      cliente.email?.toLowerCase().includes(texto) ||
      cliente.rubro?.toLowerCase().includes(texto) ||
      cliente.region?.toLowerCase().includes(texto)
    );
  });

  return (
    <main className="page">
      <section className="header header-row">
        <div>
          <h1>CRM Clientes</h1>
          <p>Gestion de clientes para vendedores en terreno</p>
        </div>

        <button
          className="btn-secondary"
          onClick={() => navigate("/dashboard")}
          type="button"
        >
          Volver al Dashboard
        </button>
      </section>

      <Link to="/crear">
        <button className="btn-primary">Nuevo Cliente</button>
      </Link>

      {location.state?.notice && (
        <section className="notice notice-success" role="status">
          <strong>Operacion completada</strong>
          <span>{location.state.notice}</span>
        </section>
      )}

      {error && <p className="error-text">{error}</p>}
      {loading && <LoadingState />}

      <section className="filters-card">
        <input
          className="search"
          type="text"
          placeholder="Buscar por cliente, empresa, correo, rubro o region..."
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
        />

        <select
          className="filter-select"
          value={estado}
          onChange={(event) => setEstado(event.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="En proceso">En proceso</option>
          <option value="Completado">Completado</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </section>

      {!loading && <section className="list">
        {clientesFiltrados.map((cliente) => (
          <article className="client-card" key={cliente.id}>
            <div>
              <h3>{cliente.empresa}</h3>
              <p>{cliente.nombre}</p>
              <span>
                {cliente.rubro} / {cliente.region}
              </span>
            </div>

            <div className="client-actions">
              <strong
                className={
                  cliente.estado === "Completado" ? "active" : "prospect"
                }
              >
                {cliente.estado}
              </strong>
              <Link to={`/clientes/${cliente.id}`}>Ver / editar</Link>
            </div>
          </article>
        ))}
      </section>}

      {!loading && clientesFiltrados.length === 0 && (
        <section className="empty-state">
          <h2>Sin clientes para mostrar</h2>
          <p>Ajusta la busqueda o registra un nuevo cliente.</p>
        </section>
      )}
    </main>
  );
}

export default Clientes;
