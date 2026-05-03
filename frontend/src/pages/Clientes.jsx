<<<<<<< Updated upstream
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { getClientes } from "../services/api";
import { filtrarClientes } from "../utils/clientes";
=======

//import { mockClientes } from "../data/mockClientes";
import { Link } from "react-router-dom";
>>>>>>> Stashed changes

// IMPORTAR SERVICIO REAL
import { useEffect, useState } from "react";
import { obtenerClientes } from "../services/clientesService";


function Clientes() {
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState([]);
<<<<<<< Updated upstream
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [error, setError] = useState("");
  const { backendUser, idToken, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(location.state?.notice || "");

  useEffect(() => {
    if (location.state?.notice) {
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    let active = true;

    async function loadClientes() {
      setLoadingClientes(true);
      setError("");

      try {
        const data = await getClientes(idToken);
        if (active) {
          setClientes(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoadingClientes(false);
        }
      }
    }

    if (idToken) {
      loadClientes();
    }

    return () => {
      active = false;
    };
  }, [idToken]);

  const clientesFiltrados = filtrarClientes(clientes, busqueda);
=======

  // 🔥 CARGAR CLIENTES DESDE BACKEND
  useEffect(() => {
    async function cargarClientes() {
      try {
        const data = await obtenerClientes();
        setClientes(data);
      } catch (error) {
        console.error("Error al cargar clientes", error);
      }
    }

    cargarClientes();
  }, []);

  // 🔍 FILTRO
  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = busqueda.toLowerCase();

    return (
      cliente.nombre?.toLowerCase().includes(texto) ||
      cliente.empresa?.toLowerCase().includes(texto) ||
      cliente.rubro?.toLowerCase().includes(texto) ||
      cliente.region?.toLowerCase().includes(texto)
    );
  });
>>>>>>> Stashed changes

  return (
    <main className="page">
      <section className="header header-row">
        <div>
          <h1>CRM Clientes</h1>
          <p>Gestion de clientes para vendedores en terreno</p>
        </div>
        <div className="session-box">
          <span>{backendUser?.nombre}</span>
          <small>{backendUser?.rol}</small>
          <button type="button" onClick={logout}>
            Cerrar sesion
          </button>
        </div>
      </section>

<<<<<<< Updated upstream
      <Link to="/crear">
        <button className="btn-primary" type="button">
          Nuevo Cliente
        </button>
      </Link>

      {notice && (
        <section className="notice notice-success" role="status">
          <strong>Operacion exitosa</strong>
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")}>
            Cerrar
          </button>
        </section>
      )}

=======
      {/* BOTÓN NUEVO CLIENTE */}
      <Link to="/crear">
        <button className="btn-primary">Nuevo Cliente</button>
      </Link>

      {/* BUSCADOR */}
>>>>>>> Stashed changes
      <section className="card">
        <input
          className="search"
          type="text"
          placeholder="Buscar por cliente, empresa, rubro o region..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </section>

<<<<<<< Updated upstream
      {loadingClientes && (
        <section className="card">
          <p className="status-message">Cargando clientes...</p>
        </section>
      )}

      {error && (
        <section className="card">
          <p className="status-message error">{error}</p>
        </section>
      )}

      {!loadingClientes && !error && clientesFiltrados.length === 0 && (
        <section className="empty-state">
          <h2>No hay clientes registrados</h2>
          <p>Crea el primer cliente para iniciar la base comercial real.</p>
        </section>
      )}

=======
      {/* LISTA */}
>>>>>>> Stashed changes
      <section className="list">
        {clientesFiltrados.map((cliente) => (
          <article className="client-card" key={cliente.id}>
            <div>
              <h3>{cliente.empresa}</h3>
              <p>{cliente.nombre}</p>
              <span>
<<<<<<< Updated upstream
                {cliente.rubro} - {cliente.region}
=======
                {cliente.rubro} · {cliente.region}
>>>>>>> Stashed changes
              </span>
            </div>

            <strong
              className={
<<<<<<< Updated upstream
                cliente.estado === "Completado" ? "active" : "prospect"
=======
                cliente.estado === "Completado"
                  ? "active"
                  : "prospect"
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
export default Clientes;
=======
export default Clientes;
>>>>>>> Stashed changes
