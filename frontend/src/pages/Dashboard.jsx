import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { getDashboardVendedor, getDashboardSupervisor } from "../services/api";

function Dashboard() {
  const { idToken, backendUser, logout } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const rol = backendUser?.rol || "vendedor";

  useEffect(() => {
    async function cargarDashboard() {
      if (!idToken) return;

      try {
        setLoading(true);

        const response =
          rol === "supervisor" || rol === "administrador"
            ? await getDashboardSupervisor(idToken)
            : await getDashboardVendedor(idToken);

        setData(response);
      } catch (err) {
        console.error("Error dashboard:", err);
        setError("No se pudo cargar el dashboard");
      } finally {
        setLoading(false);
      }
    }

    cargarDashboard();
  }, [idToken, rol]);

  return (
    <main className="page">
      <section className="header header-row">
        <div>
          <h1>Encipharm Ventas</h1>
          <p>Dashboard {rol}</p>
        </div>

        <button className="btn-secondary" onClick={logout}>
          Cerrar sesión
        </button>
      </section>

      {loading && <p>Cargando métricas...</p>}
      {error && <p className="error-text">{error}</p>}

      <section className="dashboard-grid">
        <article className="stat-card">
          <span>👥</span>
          <h3>Total clientes</h3>
          <strong>{data?.total_clientes ?? 0}</strong>
        </article>

        <article className="stat-card">
          <span>🟡</span>
          <h3>En proceso</h3>
          <strong>{data?.clientes_en_proceso ?? 0}</strong>
        </article>

        <article className="stat-card">
          <span>✅</span>
          <h3>Completados</h3>
          <strong>{data?.clientes_completados ?? 0}</strong>
        </article>
      </section>

      <section className="quick-section">
        <h2>Acciones rápidas</h2>

        <div className="quick-grid">
          <Link to="/clientes" className="quick-card">
            👥
            <strong>Clientes</strong>
          </Link>

          <Link to="/crear" className="quick-card">
            ➕
            <strong>Nuevo Cliente</strong>
          </Link>

          <Link to="/interacciones" className="quick-card">
            📋
            <strong>Interacciones</strong>
          </Link>

          <Link to="/propuestas" className="quick-card">
            📄
            <strong>Propuestas</strong>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;