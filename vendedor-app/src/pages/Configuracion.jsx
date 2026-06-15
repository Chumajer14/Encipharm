import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import Icon from "../components/Icon";
import { useAppSettings } from "../settings/AppSettings";

const LANGUAGES = [
  { label: "Español", value: "es" },
  { label: "Ingles", value: "en" },
  { label: "Portugues", value: "pt" },
];

const THEMES = [
  { label: "Nocturno", value: "dark" },
  { label: "Tema claro", value: "light" },
];

function Configuracion({ user }) {
  const { language, setLanguage, setTheme, t, theme } = useAppSettings();

  const cerrarSesion = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="logo">E</div>
        <div>
          <strong>{t("Configuracion")}</strong>
          <p className="user-email">{t("Cuenta y sincronizacion")}</p>
        </div>
      </header>

      <section className="config-card">
        <span className="config-icon"><Icon name="sync" size={22} /></span>
        <h2>{t("Sincronizacion activa")}</h2>
        <p>{t("Las oportunidades se envian al backend y el dashboard web se revalida automaticamente.")}</p>
      </section>

      <section className="config-card">
        <span className="config-icon"><Icon name="settings" size={22} /></span>
        <h2>{t("Fondo de la app")}</h2>
        <div className="segmented-control">
          {THEMES.map((item) => (
            <button
              className={theme === item.value ? "active" : ""}
              key={item.value}
              onClick={() => setTheme(item.value)}
              type="button"
            >
              {t(item.label)}
            </button>
          ))}
        </div>
      </section>

      <section className="config-card">
        <span className="config-icon"><Icon name="user" size={22} /></span>
        <h2>{t("Idioma")}</h2>
        <div className="segmented-control three">
          {LANGUAGES.map((item) => (
            <button
              className={language === item.value ? "active" : ""}
              key={item.value}
              onClick={() => setLanguage(item.value)}
              type="button"
            >
              {t(item.label)}
            </button>
          ))}
        </div>
      </section>

      <section className="config-card">
        <span className="config-icon"><Icon name="user" size={22} /></span>
        <h2>{t("Usuario")}</h2>
        <p>{user?.displayName || t("Vendedor")}</p>
        <p>{user?.email}</p>
      </section>

      <button className="danger-btn" onClick={cerrarSesion} type="button">
        {t("Cerrar sesion")}
      </button>

      <p className="app-version">Enci Ventas v1.0.0</p>
    </main>
  );
}

export default Configuracion;
