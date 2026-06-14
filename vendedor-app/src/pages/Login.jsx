import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import { loginBackend } from "../services/api";

function Login() {
  const login = async () => {
  try {

          googleProvider.setCustomParameters({
        prompt: "select_account",
      });

    const result = await signInWithPopup(auth, googleProvider);

    const token = await result.user.getIdToken();

    console.log("Token Firebase:", token);

    const backendUser = await loginBackend(token);

    console.log("Usuario backend:", backendUser);

    alert("Login correcto con backend");
  } catch (error) {
    console.error("Error login:", error);
    alert(error.message || "No se pudo iniciar sesión");
  }
};



  return (
    <main className="app-shell">
      <section className="page-title">
        <h1>Enci Ventas</h1>
        <p>Acceso vendedor</p>
      </section>

      <button className="primary-btn" onClick={login}>
        Iniciar sesión con Google
      </button>
    </main>
  );
}

export default Login;