import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";

function Login() {
  const {
    error,
    isAuthenticated,
    isFirebaseConfigured,
    loading,
    login,
  } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">Encipharm Ventas</p>
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

        {!isFirebaseConfigured && (
          <p className="status-message error">
            Falta completar la configuracion web de Firebase en frontend/.env.
          </p>
        )}

        {error && <p className="status-message error">{error}</p>}
      </section>
    </main>
  );
}

export default Login;
