import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { getClientes } from "../services/api";

function Clientes() {
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState([]);

  const navigate = useNavigate(); //CAMBIAR RUTA DESDE CLIENTE
  const [error, setError] = useState("");
  const { idToken } = useAuth();

  useEffect(() => {
    async function cargarClientes() {
      if (!idToken) return;

      try {
        const data = await getClientes(idToken);
        setClientes(data);
      } catch (error) {
        console.error("Error al cargar clientes", error);
        setError("No se pudieron cargar los clientes");
      }
    }

    cargarClientes();
  }, [idToken]);

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = busqueda.toLowerCase();

    return (
      cliente.nombre?.toLowerCase().includes(texto) ||
      cliente.empresa?.toLowerCase().includes(texto) ||
      cliente.rubro?.toLowerCase().includes(texto) ||
      cliente.region?.toLowerCase().includes(texto)
    );
  });

  return (
    <main className="page">
     <section className="header">
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    
    <div>
    
      <h1>CRM Clientes</h1>
      <p>Gestión de clientes para vendedores en terreno</p>
    </div>

    {/* BOTON PARA VOLVER AL DASHBOARD DESDE EL CRM DE CLIENTES */}

    <button 
      className="boton-volver"
      onClick={() => navigate("/dashboard")}
    >
      Volver al Dashboard
    </button>

  </div>
</section>

      <Link to="/crear">
        <button className="btn-primary">Nuevo Cliente</button>
      </Link>

      {error && <p className="error-text">{error}</p>}

      <section className="card">
        <input
          className="search"
          type="text"

          placeholder="Buscar por cliente, empresa, rubro o región..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </section>


      <section className="list">
        {clientesFiltrados.map((cliente) => (
          <article className="client-card" key={cliente.id}>
            <div>
              <h3>{cliente.empresa}</h3>
              <p>{cliente.nombre}</p>
              <span>
                {cliente.rubro} · {cliente.region}
              </span>
            </div>

            <strong
              className={
                cliente.estado === "Completado" ? "active" : "prospect"
              }
            >
              {cliente.estado}
            </strong>
          </article>
        ))}
      </section>
    </main>
  );
}


export default Clientes;
