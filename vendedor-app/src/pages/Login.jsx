import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { loginBackend } from "../services/api";
import Icon from "../components/Icon";
import { useAppSettings } from "../settings/AppSettings";

function Login({ authError = "", isFirebaseConfigured = true }) {
  const { t } = useAppSettings();

  const login = async () => {
    if (!auth) return;

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      await loginBackend(token);
    } catch (error) {
      console.error("Error login:", error);
      alert(error.message || t("No se pudo iniciar sesion"));
    }
  };

  return (
    <main className="app-shell login-shell">
      <section className="login-card">
        <div className="logo large">E</div>
        <span className="eyebrow">{t("Enci Sales Command")}</span>
        <h1>{t("Acceso vendedor")}</h1>
        <p>{t("Registra cotizaciones y consulta el pipeline desde terreno con sincronizacion directa al dashboard.")}</p>

        <button className="primary-btn" disabled={!isFirebaseConfigured} onClick={login} type="button">
          <Icon name="user" size={19} />
          {t("Iniciar sesion con Google")}
        </button>

        {authError && <p className="form-error">{authError}</p>}
        {!isFirebaseConfigured && (
          <p className="form-error">{t("Configura las variables VITE_FIREBASE_* antes de desplegar.")}</p>
        )}
      </section>
    </main>
  );
}

export default Login;
