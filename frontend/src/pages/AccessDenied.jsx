import { Link } from "react-router-dom";
import { getRoleLabel } from "../auth/roles";
import { useAuth } from "../auth/authContext";

/**
 * Renderiza el estado 403 controlado para usuarios autenticados sin acceso.
 */
function AccessDenied({ minimumRole = "vendedor", userRole }) {
  const { logout } = useAuth();
  const isPendingAccess = userRole === "sin_acceso";

  return (
    <main className="page access-denied-page">
      <section className="empty-state access-denied-panel">
        <h1>{isPendingAccess ? "Cuenta pendiente de aprobacion" : "Acceso restringido"}</h1>
        <p>
          {isPendingAccess
            ? "Tu cuenta fue registrada, pero un administrador debe asignarte rol vendedor o administrador antes de ingresar al sistema."
            : `Tu rol actual es ${getRoleLabel(userRole)}. Esta seccion requiere rol ${getRoleLabel(minimumRole)} o superior.`}
        </p>
        {isPendingAccess ? (
          <button type="button" onClick={logout}>Salir</button>
        ) : (
          <Link to="/dashboard">
            <button type="button">Volver al dashboard</button>
          </Link>
        )}
      </section>
    </main>
  );
}

export default AccessDenied;
