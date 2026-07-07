import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import LoadingState from "../components/LoadingState";
import useCachedQuery from "../hooks/useCachedQuery";
import { getClientes } from "../services/api";

const PAGE_SIZE = 10;

function Clientes() {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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
  const totalPages = Math.max(1, Math.ceil(clientesFiltrados.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const clientesPaginados = clientesFiltrados.slice(startIndex, endIndex);
  const rangeStart = clientesFiltrados.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(endIndex, clientesFiltrados.length);

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
          onChange={(event) => {
            setBusqueda(event.target.value);
            setCurrentPage(1);
          }}
        />

        <select
          className="filter-select"
          value={estado}
          onChange={(event) => {
            setEstado(event.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="En proceso">En proceso</option>
          <option value="Completado">Completado</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </section>

      {!loading && <section className="list">
        {clientesPaginados.map((cliente) => (
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

      {!loading && clientesFiltrados.length > PAGE_SIZE && (
        <section className="pagination-bar" aria-label="Paginacion de clientes">
          <span>
            Mostrando {rangeStart}-{rangeEnd} de {clientesFiltrados.length} clientes
          </span>
          <div className="pagination-actions">
            <button
              className="btn-secondary compact"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              Anterior
            </button>
            <strong>Pagina {safePage} de {totalPages}</strong>
            <button
              className="btn-secondary compact"
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              type="button"
            >
              Siguiente
            </button>
          </div>
        </section>
      )}

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
