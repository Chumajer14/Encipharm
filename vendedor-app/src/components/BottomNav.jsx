import { NavLink } from "react-router-dom";
import Icon from "./Icon";

const NAV_ITEMS = [
  { label: "Inicio", path: "/", icon: "home" },
  { label: "Nuevo", path: "/cotizacion", icon: "add" },
  { label: "Forecast", path: "/proyeccion", icon: "forecast" },
  { label: "Pipeline", path: "/pipeline", icon: "pipeline" },
];

function BottomNav() {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <NavLink
          className={({ isActive }) => (isActive ? "nav-active" : "")}
          key={item.path}
          to={item.path}
        >
          <Icon name={item.icon} size={19} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
