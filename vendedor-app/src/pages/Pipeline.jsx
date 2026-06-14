import { useEffect, useState } from "react";
import { db } from "../db/dexie";
import { actualizarOportunidad } from "../services/api";
import { ETAPAS, toBackendStage } from "../utils/etapas";

function Pipeline({ token }) {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const cargarCotizaciones = async () => {
    const data = await db.cotizaciones.toArray();
    setCotizaciones(data);
  };

  useEffect(() => {
    db.cotizaciones.toArray().then(setCotizaciones);
  }, []);

  const cambiarEtapa = async (id, nuevaEtapa) => {
    setMensaje("");
    const cotizacion = cotizaciones.find((item) => item.id === id);

    await db.cotizaciones.update(id, {
      estado: nuevaEtapa,
      sincronizada: false,
    });

    if (cotizacion?.oportunidadId) {
      try {
        await actualizarOportunidad(token, cotizacion.oportunidadId, {
          etapa: toBackendStage(nuevaEtapa),
        });
        await db.cotizaciones.update(id, {
          sincronizada: true,
        });
      } catch (error) {
        console.error("Error sincronizando etapa:", error);
        setMensaje("La etapa quedo local. Reintenta cuando el backend este disponible.");
      }
    }

    await cargarCotizaciones();
  };

  return (
    <main className="app-shell">
      <section className="page-title">
        <h1>Pipeline</h1>
        <p>Seguimiento comercial del vendedor</p>
      </section>
      {mensaje && <p className="form-message">{mensaje}</p>}

      {ETAPAS.map((etapa) => {
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
                    {(item.cliente || "?").charAt(0)}
                  </div>
                  <h3>{item.cliente}</h3>
                  <p>{item.productoNombre}</p>

                  <strong>
                    ${Number(item.monto || 0).toLocaleString("es-CL")}
                  </strong>

                  <small>Probabilidad: {item.probabilidad}%</small>
                  {!item.sincronizada && <small>Pendiente de sincronizar</small>}

                  <select
                    className="stage-select"
                    value={item.estado}
                    onChange={(event) => cambiarEtapa(item.id, event.target.value)}
                  >
                    {ETAPAS.map((opcion) => (
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
