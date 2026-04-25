import { useState } from "react";
import { mockClientes } from "../data/mockClientes";
import { Link } from "react-router-dom";

function Clientes() {
  const [busqueda, setBusqueda] = useState("");

  const clientesFiltrados = mockClientes.filter((cliente) => {
    const texto = busqueda.toLowerCase();

    return (
      cliente.nombre.toLowerCase().includes(texto) ||
      cliente.empresa.toLowerCase().includes(texto) ||
      cliente.rubro.toLowerCase().includes(texto) ||
      cliente.region.toLowerCase().includes(texto)
    );
  });

  return (
    <main className="page">
      <section className="header">
        <div>
          <h1>CRM Clientes</h1>
          <p>Gestión de clientes para vendedores en terreno</p>
        </div>
      </section>

       <Link to="/crear">
        <button className="btn-primary"> Nuevo Cliente</button>
      </Link>


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
              <span>{cliente.rubro} · {cliente.region}</span>
            </div>
            
            <strong className={cliente.estado === "Completado" ? "active" : "prospect"}>     {/* CAMBIA EL COLOR SI EL ESTADO ESTÁ COMPLETADO */}
            
              {cliente.estado}
            </strong>
          </article>
        ))}
      </section>
    </main>
  );
}

<Link to="/crear">
  <button style={{ marginBottom: "20px" }}>
    + Nuevo Cliente
  </button>
</Link>

export default Clientes;