import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { getFirebaseConfigHelpMessage } from "../services/firebase";


function Login() {
  const {
    error,
    isAuthenticated,
    isFirebaseConfigured,
    loading,
    login,
  } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const isVercelPreview = window.location.hostname.endsWith(".vercel.app");

  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">Enci Ventas</p>
        <h1>Acceso seguro al CRM comercial</h1>
        <p>
          Ingresa con Google para obtener el token de Firebase y autorizar tu
          sesion contra la API.
        </p>

        <button
          className="login-button"
          disabled={!isFirebaseConfigured || loading}
          type="button"
          onClick={login}
        >
          {loading ? "Validando sesion..." : "Login con Google"}
        </button>

        {loading && isVercelPreview && (
          <p className="status-message backend-wakeup-note">
            El backend gratuito puede estar encendiendo. Este primer acceso puede
            tardar cerca de 40 segundos por el uso de infraestructura sin costo,
            no por un problema de la app. Si no redirecciona, actualiza la pagina
            e intenta nuevamente.
          </p>
        )}

        {!isFirebaseConfigured && (
          <p className="status-message error">
            {getFirebaseConfigHelpMessage()}
          </p>
        )}

        {error && <p className="status-message error">{error}</p>}
      </section>
    </main>
  );
}

export default Login;
