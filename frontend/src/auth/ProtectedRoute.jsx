import { Navigate } from "react-router-dom";
import TemporaryRoleSwitcher from "../components/TemporaryRoleSwitcher";
import { useAuth } from "./authContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

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

  return (
    <>
      <TemporaryRoleSwitcher />
      {children}
    </>
  );
}

export default ProtectedRoute;
