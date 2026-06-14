import { NavLink } from "react-router-dom";

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => (isActive ? "nav-active" : "")}>
        <span>Inicio</span>
        Inicio
      </NavLink>

      <NavLink to="/cotizacion" className={({ isActive }) => (isActive ? "nav-active" : "")}>
        <span>Nuevo</span>
        Cotizacion
      </NavLink>

      <NavLink to="/proyeccion" className={({ isActive }) => (isActive ? "nav-active" : "")}>
        <span>Forecast</span>
        Proyeccion
      </NavLink>

      <NavLink to="/pipeline" className={({ isActive }) => (isActive ? "nav-active" : "")}>
        <span>Etapas</span>
        Pipeline
      </NavLink>
    </nav>
  );
}

export default BottomNav;
