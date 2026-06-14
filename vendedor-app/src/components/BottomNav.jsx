import { NavLink } from "react-router-dom";

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => (isActive ? "nav-active" : "")}>
        <span>🏠</span>
        Inicio
      </NavLink>

      <NavLink to="/cotizacion" className={({ isActive }) => (isActive ? "nav-active" : "")}>
        <span>📄</span>
        Cotización
      </NavLink>

      <NavLink to="/proyeccion" className={({ isActive }) => (isActive ? "nav-active" : "")}>
        <span>📈</span>
        Proyección
      </NavLink>

      <NavLink to="/pipeline" className={({ isActive }) => (isActive ? "nav-active" : "")}>
        <span>📊</span>
        Pipeline
      </NavLink>
    </nav>
  );
}

export default BottomNav;