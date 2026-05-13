import { Navigate } from "react-router-dom";
import AccessDenied from "../pages/AccessDenied";
import { hasMinimumRole } from "./roles";
import { useAuth } from "./authContext";

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

  return children;
}

export default ProtectedRoute;
