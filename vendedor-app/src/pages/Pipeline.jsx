import { useEffect, useState } from "react";
import { db } from "../db/dexie";

const etapas = [
  "Prospección",
  "Calificación",
  "Propuesta",
  "Negociación",
  "Cierre",
  "Perdido",
];



function Pipeline() {
  const [cotizaciones, setCotizaciones] = useState([]);

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  

  const cargarCotizaciones = async () => {
    const data = await db.cotizaciones.toArray();
    setCotizaciones(data);
  };

  const cambiarEtapa = async (id, nuevaEtapa) => {
    await db.cotizaciones.update(id, {
      estado: nuevaEtapa,
    });

    cargarCotizaciones();
  };

  return (
    <main className="app-shell">
      <section className="page-title">
        <h1>📊 Pipeline</h1>
        <p>Seguimiento comercial del vendedor</p>
      </section>

      {etapas.map((etapa) => {
        const items = cotizaciones.filter((item) => item.estado === etapa);

        return (
          <section className="pipeline-section" key={etapa}>
            <div className="pipeline-header">
              <h2>{etapa}</h2>
              <span>{items.length}</span>
            </div>

            <div className="pipeline-list">
              {items.map((item) => (
                <article className="pipeline-card" key={item.id}>
                                  <div className="avatar">
                  {item.cliente.charAt(0)}
                </div>
                  <h3>{item.cliente}</h3>
                  <p>{item.productoNombre}</p>

                  <strong>
                    ${Number(item.monto || 0).toLocaleString("es-CL")}
                  </strong>

                  <small>Probabilidad: {item.probabilidad}%</small>

                  <select
                    className="stage-select"
                    value={item.estado}
                    onChange={(e) => cambiarEtapa(item.id, e.target.value)}
                  >
                    {etapas.map((opcion) => (
                      <option key={opcion} value={opcion}>
                        {opcion}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}

export default Pipeline;