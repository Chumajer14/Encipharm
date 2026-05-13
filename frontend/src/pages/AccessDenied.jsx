import { Link } from "react-router-dom";
import { getRoleLabel } from "../auth/roles";

/**
 * Renderiza el estado 403 controlado para usuarios autenticados sin acceso.
 */
function AccessDenied({ minimumRole = "vendedor", userRole }) {
  return (
    <main className="page access-denied-page">
      <section className="empty-state access-denied-panel">
        <h1>Acceso restringido</h1>
        <p>
          Tu rol actual es {getRoleLabel(userRole)}. Esta seccion requiere rol{" "}
          {getRoleLabel(minimumRole)} o superior.
        </p>
        <Link to="/dashboard">
          <button type="button">Volver al dashboard</button>
        </Link>
      </section>
    </main>
  );
}

export default AccessDenied;
