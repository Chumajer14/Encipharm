import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { useI18n } from "../i18n/useI18n";

const NAV_SECTIONS = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: "dashboard" },
      { label: "Pipeline & Funnels", path: "/oportunidades", icon: "pipeline" },
      { label: "Proyecciones", path: "/proyecciones", icon: "chart" },
    ],
  },
  {
    title: "Gestion",
    items: [
      { label: "Equipo de Ventas", path: "/equipo", icon: "team" },
      { label: "Inteligencia de Mercado", path: "/inteligencia", icon: "shield" },
      { label: "Análisis de Competencia", path: "/competencia", icon: "analysis" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { label: "Configuración", path: "/configuracion", icon: "settings" },
    ],
  },
];

const NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

const ICON_PATHS = {
  dashboard: ["M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"],
  pipeline: ["M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"],
  chart: ["M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"],
  team: ["M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"],
  shield: ["M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"],
  analysis: ["M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"],
  settings: [
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  ],
};

const HEADER_ICON_PATHS = {
  search: ["M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"],
  bell: ["M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"],
  calendar: ["M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"],
};

function SvgIcon({ paths, className, size = 20 }) {
  const pathList = Array.isArray(paths) ? paths : [paths];
  return (
    <svg aria-hidden="true" className={className} fill="none" height={size} viewBox="0 0 24 24" width={size}>
      {pathList.map((path) => (
        <path d={path} key={path} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      ))}
    </svg>
  );
}

function NavIcon({ name }) {
  return <SvgIcon className="nav-icon" paths={ICON_PATHS[name]} />;
}

function HeaderIcon({ name }) {
  return <SvgIcon paths={HEADER_ICON_PATHS[name]} size={name === "search" ? 18 : 20} />;
}

function NotOperationalModal({ onClose }) {
  return (
    <div className="not-operational-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-labelledby="not-operational-title"
        aria-modal="true"
        className="not-operational-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="not-operational-close" type="button" aria-label="Cerrar" onClick={onClose}>
          X
        </button>
        <div className="not-operational-mark" aria-hidden="true">X</div>
        <h2 id="not-operational-title">No operativo.</h2>
      </section>
    </div>
  );
}

function getInitials(name = "", email = "") {
  const source = name || email.split("@")[0] || "Enci Ventas";
  return source
    .split(/[\s._-]+/)
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

function AppShell({ children, roleSwitcher }) {
  const { backendUser, logout } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const email = backendUser?.email || "usuario@enci.cl";
  const displayName = backendUser?.nombre || email;
  const currentPosition = backendUser?.rango || backendUser?.cargo || "Vendedor";
  const pageTitle = t(getPageTitle(location.pathname));

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">E</span>
            <div>
              <strong className="logo-text">Enci</strong>
              <span className="logo-subtitle">{t("Sales Command")}</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div className="nav-section" key={section.title}>
              <span className="nav-section-title">{t(section.title)}</span>
              {section.items.map((item) => (
                <NavLink className="nav-item" key={`${section.title}-${item.label}`} to={item.path}>
                  <NavIcon name={item.icon} />
                  <span>{t(item.label)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <span className="user-avatar">{getInitials(displayName, email)}</span>
            <div className="user-info">
              <strong className="user-name">{displayName}</strong>
              <span className="user-role">{currentPosition}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h1>{pageTitle}</h1>
            <span className="breadcrumb">{t("Inicio")} / <strong>{pageTitle}</strong></span>
          </div>

          <div className="topbar-right">
            <div className="topbar-search" aria-hidden="true">
              <HeaderIcon name="search" />
              <input disabled placeholder={t("Buscar cliente, vendedor...")} />
            </div>
            <button className="header-icon-btn" type="button" aria-label="Notificaciones" onClick={() => setShowUnavailableModal(true)}>
              <span className="notification-dot" />
              <HeaderIcon name="bell" />
            </button>
            <button className="header-icon-btn" type="button" aria-label="Calendario" onClick={() => setShowUnavailableModal(true)}>
              <HeaderIcon name="calendar" />
            </button>
            <button className="btn-secondary compact" onClick={logout} type="button">
              {t("Salir")}
            </button>
          </div>
        </header>

        {roleSwitcher}
        {children}
        <div className="firebase-quota-note" role="note">
          <strong>Modo ahorro Firebase activo.</strong>
          <span>
            Los datos se mantienen en cache breve y se revalidan automaticamente para reflejar cambios recientes desde la app movil y el dashboard.
          </span>
        </div>
      </div>
      {showUnavailableModal && <NotOperationalModal onClose={() => setShowUnavailableModal(false)} />}
    </div>
  );
}

export default AppShell;
