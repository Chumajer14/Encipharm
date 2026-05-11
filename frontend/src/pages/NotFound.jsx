import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";

function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="page not-found-page">
      <section className="empty-state not-found-panel">
        <h1>Pagina no encontrada</h1>
        <p>La ruta solicitada no existe en el CRM.</p>
        <Link to={isAuthenticated ? "/dashboard" : "/login"}>
          <button type="button">Volver</button>
        </Link>
      </section>
    </main>
  );
}

export default NotFound;
