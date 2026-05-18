import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { getRoleLabel } from "../auth/roles";

const NAV_SECTIONS = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: "DB" },
      { label: "Pipeline & Funnels", path: "/oportunidades", icon: "PF" },
      { label: "Proyecciones", path: "/proyecciones", icon: "PY" },
    ],
  },
  {
    title: "Gestion",
    items: [
      { label: "Equipo de Ventas", path: "/equipo", icon: "EV" },
      { label: "Inteligencia de Mercado", path: "/inteligencia", icon: "IM" },
      { label: "Analisis de Competencia", path: "/competencia", icon: "AC" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { label: "Configuracion", path: "/configuracion", icon: "CF" },
    ],
  },
];

const NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

function getInitials(email = "") {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "EV";
}

function getPageTitle(pathname) {
  const activeItem = NAV_ITEMS
    .filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
    .sort((first, second) => second.path.length - first.path.length)[0];

  return activeItem?.label || "Command Center";
}

/**
 * Provides the authenticated dashboard chrome shared by all protected routes.
 */
function AppShell({ children, roleSwitcher }) {
  const { backendUser, logout } = useAuth();
  const location = useLocation();
  const email = backendUser?.email || "usuario@encipharm.cl";
  const roleLabel = getRoleLabel(backendUser?.rol || "vendedor");

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">E</span>
            <div>
              <strong className="logo-text">Encipharm</strong>
              <span className="logo-subtitle">Sales Command</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div className="nav-section" key={section.title}>
              <span className="nav-section-title">{section.title}</span>
              {section.items.map((item) => (
                <NavLink className="nav-item" key={`${section.title}-${item.label}`} to={item.path}>
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <span className="user-avatar">{getInitials(email)}</span>
            <div className="user-info">
              <strong className="user-name">{email}</strong>
              <span className="user-role">{roleLabel}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h1>{getPageTitle(location.pathname)}</h1>
            <span className="breadcrumb">Inicio / <strong>{getPageTitle(location.pathname)}</strong></span>
          </div>

          <div className="topbar-right">
            <div className="topbar-search" aria-hidden="true">
              <span>Q</span>
              <input disabled placeholder="Buscar cliente, vendedor..." />
            </div>
            <button className="header-icon-btn" type="button" aria-label="Notificaciones">
              <span className="notification-dot" />
              N
            </button>
            <button className="header-icon-btn" type="button" aria-label="Calendario">
              C
            </button>
            <button className="btn-secondary compact" onClick={logout} type="button">
              Salir
            </button>
          </div>
        </header>

        {roleSwitcher}
        {children}
      </div>
    </div>
  );
}

export default AppShell;
