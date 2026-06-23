import { NavLink } from "react-router-dom";

import Icon from "./Icon";
import { useAppSettings } from "../settings/AppSettings";

const NAV_ITEMS = [
  { label: "Inicio", path: "/", icon: "home" },
  { label: "Nuevo", path: "/cotizacion", icon: "add" },
  { label: "Forecast", path: "/proyeccion", icon: "forecast" },
  { label: "Enci Chat", path: "/enci-chat", icon: "spark" },
  { label: "Pipeline", path: "/pipeline", icon: "pipeline" },
];

function BottomNav() {
  const { t } = useAppSettings();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <NavLink
          className={({ isActive }) => (isActive ? "nav-active" : "")}
          key={item.path}
          to={item.path}
        >
          <Icon name={item.icon} size={19} />
          <span>{t(item.label)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
