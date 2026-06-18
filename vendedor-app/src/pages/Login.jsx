import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { loginBackend } from "../services/api";
import Icon from "../components/Icon";
import { useAppSettings } from "../settings/AppSettings";
import { ensureMobileAccess } from "../utils/access";

function Login({ authError = "", isFirebaseConfigured = true }) {
  const { t } = useAppSettings();

  function getFriendlyLoginError(error) {
    if (error?.code === "auth/unauthorized-domain") {
      return t("Este dominio no esta autorizado en Firebase Authentication.");
    }

    if (error?.code === "auth/operation-not-allowed") {
      return t("El proveedor Google no esta habilitado en Firebase Authentication.");
    }

    if (error?.code === "auth/internal-error") {
      return t("Firebase no pudo abrir el login con popup. Reintentando con redireccion segura.");
    }

    return error.message || t("No se pudo iniciar sesion");
  }

  const login = async () => {
    if (!auth) return;

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      const backendUser = await loginBackend(token);
      ensureMobileAccess(backendUser);
    } catch (error) {
      console.error("Error login:", error);
      if (["auth/internal-error", "auth/popup-blocked", "auth/cancelled-popup-request"].includes(error?.code)) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      alert(getFriendlyLoginError(error));
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
