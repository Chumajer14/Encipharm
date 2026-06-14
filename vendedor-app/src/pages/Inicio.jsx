import { Link } from "react-router-dom";

function Inicio({ user }) {
  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="logo">E</div>

        <div>
          <strong>Encipharm Ventas</strong>
          <p className="user-email">{user?.email}</p>
        </div>

        <Link to="/configuracion" className="icon-btn">
          Config
        </Link>
      </header>

      <div className="online-pill">Online</div>

      <section className="page-title">
        <h1>Inicio</h1>
        <p>Panel operativo del vendedor</p>
      </section>

      <section className="quick-actions">
        <Link to="/cotizacion" className="quick-card green">
          <span>+</span>
          <strong>Nueva Cotizacion</strong>
        </Link>

        <Link to="/pipeline" className="quick-card purple">
          <span>#</span>
          <strong>Pipeline</strong>
        </Link>

        <Link to="/proyeccion" className="quick-card orange">
          <span>%</span>
          <strong>Proyeccion</strong>
        </Link>

        <Link to="/configuracion" className="quick-card red">
          <span>*</span>
          <strong>Configuracion</strong>
        </Link>
      </section>
    </main>
  );
}

export default Inicio;
