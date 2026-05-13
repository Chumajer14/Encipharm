import { Navigate } from "react-router-dom";
import TemporaryRoleSwitcher from "../components/TemporaryRoleSwitcher";
import AccessDenied from "../pages/AccessDenied";
import { hasMinimumRole } from "./roles";
import { useAuth } from "./authContext";

const showTemporaryRoleSwitcher =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_TEMP_ROLE_SWITCHER === "true";

function ProtectedRoute({ children, minimumRole = "vendedor" }) {
  const { backendUser, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <main className="page">
        <section className="card">
          <p className="status-message">Validando sesion...</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasMinimumRole(backendUser?.rol, minimumRole)) {
    return <AccessDenied minimumRole={minimumRole} userRole={backendUser?.rol} />;
  }

  return (
    <>
      {showTemporaryRoleSwitcher && <TemporaryRoleSwitcher />}
      {children}
    </>
  );
}

export default ProtectedRoute;
