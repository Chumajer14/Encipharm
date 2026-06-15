import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { useAppSettings } from "../settings/AppSettings";

function Inicio({ user }) {
  const { t } = useAppSettings();
  const sellerName = user?.displayName || user?.email?.split("@")[0] || "Vendedor";

  return (
    <main className="app-shell">
      <header className="top-bar app-hero">
        <div className="brand-lockup">
          <div className="logo">E</div>

          <div>
            <strong>Enci</strong>
            <p className="user-email">Sales command</p>
          </div>
        </div>

        <Link to="/configuracion" className="icon-btn" aria-label={t("Configuracion")}>
          <Icon name="settings" size={19} />
        </Link>
      </header>

      <section className="welcome-card">
        <div>
          <span className="eyebrow">{t("Sesion activa")}</span>
          <h1>{sellerName}</h1>
          <p>{t("Gestiona cotizaciones, pipeline y forecast desde terreno.")}</p>
        </div>
        <span className="online-pill"><Icon name="sync" size={15} /> {t("Online")}</span>
      </section>

      <section className="mobile-kpi-grid" aria-label="Resumen operativo">
        <article>
          <span>{t("Actualizacion")}</span>
          <strong>30s</strong>
        </article>
        <article>
          <span>{t("Modo")}</span>
          <strong>{t("Campo")}</strong>
        </article>
      </section>

      <section className="quick-actions">
        <Link to="/cotizacion" className="quick-card green">
          <Icon name="add" size={24} />
          <strong>{t("Nueva Cotizacion")}</strong>
          <small>{t("Crear oportunidad")}</small>
        </Link>

        <Link to="/pipeline" className="quick-card purple">
          <Icon name="pipeline" size={24} />
          <strong>{t("Pipeline")}</strong>
          <small>{t("Gestionar etapas")}</small>
        </Link>

        <Link to="/proyeccion" className="quick-card orange">
          <Icon name="forecast" size={24} />
          <strong>{t("Proyeccion")}</strong>
          <small>{t("Forecast ponderado")}</small>
        </Link>

        <Link to="/configuracion" className="quick-card blue">
          <Icon name="settings" size={24} />
          <strong>{t("Configuracion")}</strong>
          <small>{t("Cuenta y sesion")}</small>
        </Link>
      </section>
    </main>
  );
}

export default Inicio;
