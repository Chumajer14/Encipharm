import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import Icon from "../components/Icon";

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
        <div>
          <strong>Configuracion</strong>
          <p className="user-email">Cuenta y sincronizacion</p>
        </div>
      </header>

      <section className="config-card">
        <span className="config-icon"><Icon name="sync" size={22} /></span>
        <h2>Sincronizacion activa</h2>
        <p>Las oportunidades se envian al backend y el dashboard web se revalida automaticamente.</p>
      </section>

      <section className="config-card">
        <span className="config-icon"><Icon name="user" size={22} /></span>
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
