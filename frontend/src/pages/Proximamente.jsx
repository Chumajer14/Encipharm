import { Link } from "react-router-dom";

function Proximamente({ titulo }) {
  return (
    <main className="page">
      <section className="header header-row">
        <div>
          <h1>{titulo}</h1>
          <p>Modulo planificado para EPIC 3.</p>
        </div>

        <Link to="/dashboard">
          <button className="btn-secondary" type="button">
            Volver al Dashboard
          </button>
        </Link>
      </section>

      <section className="empty-state">
        <h2>Modulo no habilitado en EPIC 2</h2>
        <p>El flujo esta reservado para interacciones, pipeline y propuestas basicas.</p>
      </section>
    </main>
  );
}

export default Proximamente;
