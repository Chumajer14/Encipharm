import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";

function Configuracion({ user }) {
  const cerrarSesion = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="logo">E</div>
        <strong>Configuracion</strong>
      </header>

      <section className="config-card">
        <h2>Conectado</h2>
        <p>Datos sincronizados</p>
      </section>

      <section className="config-card">
        <h2>Usuario</h2>
        <p>{user?.displayName || "Vendedor"}</p>
        <p>{user?.email}</p>
      </section>

      <button className="danger-btn" onClick={cerrarSesion} type="button">
        Cerrar sesion
      </button>

      <p className="app-version">Encipharm Ventas v1.0.0</p>
    </main>
  );
}

export default Configuracion;
