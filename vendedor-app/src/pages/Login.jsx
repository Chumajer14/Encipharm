import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { loginBackend } from "../services/api";

function Login({ authError = "", isFirebaseConfigured = true }) {
  const login = async () => {
    if (!auth) return;

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      await loginBackend(token);
    } catch (error) {
      console.error("Error login:", error);
      alert(error.message || "No se pudo iniciar sesion");
    }
  };

  return (
    <main className="app-shell">
      <section className="page-title">
        <h1>Enci Ventas</h1>
        <p>Acceso vendedor</p>
      </section>

      <button className="primary-btn" disabled={!isFirebaseConfigured} onClick={login} type="button">
        Iniciar sesion con Google
      </button>
      {authError && <p className="form-error">{authError}</p>}
      {!isFirebaseConfigured && (
        <p className="form-error">Configura las variables VITE_FIREBASE_* antes de desplegar.</p>
      )}
    </main>
  );
}

export default Login;
