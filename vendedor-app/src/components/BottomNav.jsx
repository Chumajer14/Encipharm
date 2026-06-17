import { NavLink } from "react-router-dom";
import Icon from "./Icon";
import { useAppSettings } from "../settings/AppSettings";

const NAV_ITEMS = [
  { label: "Inicio", path: "/", icon: "home" },
  { label: "Nuevo", path: "/cotizacion", icon: "add" },
  { label: "Forecast", path: "/proyeccion", icon: "forecast" },
  { label: "IA RAG", path: "/ia-rag", emoji: "🤖" },
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
          {item.emoji ? <span className="nav-emoji" aria-hidden="true">{item.emoji}</span> : <Icon name={item.icon} size={19} />}
          <span>{t(item.label)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
