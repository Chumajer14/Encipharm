import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { getDashboardVendedor, getDashboardSupervisor } from "../services/api";

function getCount(items = [], key) {
  return items.find((item) => item.clave === key)?.total ?? 0;
}

function Dashboard() {
  const { idToken, backendUser, logout } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const rol = backendUser?.rol || "vendedor";
  const isSupervisorView = rol === "supervisor" || rol === "admin";

  useEffect(() => {
    async function cargarDashboard() {
      if (!idToken) return;

      try {
        setLoading(true);
        const response = isSupervisorView
          ? await getDashboardSupervisor(idToken)
          : await getDashboardVendedor(idToken);

        setData(response);
      } catch (loadError) {
        console.error("Error dashboard:", loadError);
        setError("No se pudo cargar el dashboard");
      } finally {
        setLoading(false);
      }
    }

    cargarDashboard();
  }, [idToken, isSupervisorView]);

  return (
    <main className="page">
      <section className="header header-row">
        <div>
          <h1>Encipharm Ventas</h1>
          <p>
            Dashboard {isSupervisorView ? "supervisor" : "vendedor"} / {backendUser?.email}
          </p>
        </div>

        <button className="btn-secondary" onClick={logout} type="button">
          Cerrar sesion
        </button>
      </section>

      {loading && <p>Cargando metricas...</p>}
      {error && <p className="error-text">{error}</p>}

      <section className="dashboard-grid">
        <article className="stat-card">
          <span>CL</span>
          <h3>Total clientes</h3>
          <strong>{data?.totalClientes ?? 0}</strong>
        </article>

        <article className="stat-card">
          <span>EP</span>
          <h3>En proceso</h3>
          <strong>{getCount(data?.clientesPorEstado, "En proceso")}</strong>
        </article>

        <article className="stat-card">
          <span>OK</span>
          <h3>Completados</h3>
          <strong>{getCount(data?.clientesPorEstado, "Completado")}</strong>
        </article>

        <article className="stat-card">
          <span>OP</span>
          <h3>Oportunidades</h3>
          <strong>{data?.totalOportunidades ?? 0}</strong>
        </article>

        <article className="stat-card">
          <span>VP</span>
          <h3>Valor pipeline</h3>
          <strong>${Number(data?.valorPipeline || 0).toLocaleString()}</strong>
        </article>

        <article className="stat-card">
          <span>PA</span>
          <h3>Propuestas aceptadas</h3>
          <strong>${Number(data?.valorPropuestasAceptadas || 0).toLocaleString()}</strong>
        </article>
      </section>

      {isSupervisorView && (
        <section className="dashboard-detail">
          <article>
            <h2>Clientes por rubro</h2>
            {data?.clientesPorRubro?.map((item) => (
              <p key={item.clave}>
                <span>{item.clave}</span>
                <strong>{item.total}</strong>
              </p>
            ))}
          </article>

          <article>
            <h2>Clientes por region</h2>
            {data?.clientesPorRegion?.map((item) => (
              <p key={item.clave}>
                <span>{item.clave}</span>
                <strong>{item.total}</strong>
              </p>
            ))}
          </article>

          <article>
            <h2>Oportunidades por etapa</h2>
            {data?.oportunidadesPorEtapa?.map((item) => (
              <p key={item.clave}>
                <span>{item.clave}</span>
                <strong>{item.total}</strong>
              </p>
            ))}
          </article>

          <article>
            <h2>Propuestas por estado</h2>
            {data?.propuestasPorEstado?.map((item) => (
              <p key={item.clave}>
                <span>{item.clave}</span>
                <strong>{item.total}</strong>
              </p>
            ))}
          </article>
        </section>
      )}

      <section className="quick-section">
        <h2>Acciones rapidas</h2>

        <div className="quick-grid">
          <Link to="/clientes" className="quick-card">
            <span>CL</span>
            <strong>Clientes</strong>
          </Link>

          <Link to="/crear" className="quick-card">
            <span>+</span>
            <strong>Nuevo Cliente</strong>
          </Link>

          <Link to="/interacciones" className="quick-card">
            <span>IN</span>
            <strong>Interacciones</strong>
          </Link>

          <Link to="/oportunidades" className="quick-card">
            <span>OP</span>
            <strong>Oportunidades</strong>
          </Link>

          <Link to="/propuestas" className="quick-card">
            <span>PR</span>
            <strong>Propuestas</strong>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
