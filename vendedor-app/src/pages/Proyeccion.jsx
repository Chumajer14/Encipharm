import { useEffect, useState } from "react";
import { db } from "../db/dexie";
import { getOportunidades } from "../services/api";
import { fromBackendStage } from "../utils/etapas";

function mapBackendOpportunity(oportunidad) {
  const monto = Number(oportunidad.valorEstimado || 0);
  const probabilidad = Number(oportunidad.probabilidad || 0);
  return {
    id: `backend-${oportunidad.id}`,
    oportunidadId: oportunidad.id,
    cliente: oportunidad.titulo?.split(" - ")[0] || oportunidad.clienteId || "Cliente sin nombre",
    productoNombre: oportunidad.descripcion || oportunidad.titulo || "Oportunidad",
    monto,
    probabilidad,
    valorPonderado: (monto * probabilidad) / 100,
    estado: fromBackendStage(oportunidad.etapa),
  };
}

function mergeCotizaciones(locales, remotas) {
  const remoteIds = new Set(remotas.map((item) => item.oportunidadId).filter(Boolean));
  const localOnly = locales.filter((item) => !item.oportunidadId || !remoteIds.has(item.oportunidadId));
  return [...remotas, ...localOnly];
}

function Proyeccion({ token }) {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    async function cargar() {
      const locales = await db.cotizaciones.toArray();
      try {
        const oportunidades = await getOportunidades(token);
        setCotizaciones(mergeCotizaciones(locales, oportunidades.map(mapBackendOpportunity)));
        setMensaje("");
      } catch (error) {
        console.error("Error cargando oportunidades:", error);
        setCotizaciones(locales);
        setMensaje("Mostrando datos locales. No se pudo sincronizar con backend.");
      }
    }

    if (token) {
      cargar();
    }
  }, [token]);

  const totalPipeline = cotizaciones.reduce(
    (acc, item) => acc + Number(item.monto || 0),
    0,
  );

  const totalPonderado = cotizaciones.reduce(
    (acc, item) => acc + Number(item.valorPonderado || 0),
    0,
  );

  return (
    <main className="app-shell">
      <section className="page-title">
        <h1>Proyeccion</h1>
        <p>Forecast comercial del vendedor</p>
      </section>
      {mensaje && <p className="form-message">{mensaje}</p>}

      <section className="stats-grid">
        <article className="metric-card">
          <span>Pipeline bruto</span>
          <strong>${totalPipeline.toLocaleString("es-CL")}</strong>
        </article>

        <article className="metric-card success">
          <span>Proyeccion ponderada</span>
          <strong>${totalPonderado.toLocaleString("es-CL")}</strong>
        </article>
      </section>

      <section className="section-title">
        <h2>Cotizaciones recientes</h2>
      </section>

      <section className="quote-list">
        {cotizaciones.length === 0 && (
          <article className="empty-card">
            <h3>Sin cotizaciones</h3>
            <p>Registra una cotizacion para calcular tu proyeccion.</p>
          </article>
        )}

        {cotizaciones.map((item) => (
          <article className="quote-card" key={item.id}>
            <div className="quote-header">
              <div>
                <h3>{item.cliente || "Cliente sin nombre"}</h3>
                <p>{item.productoNombre || "Producto no seleccionado"}</p>
              </div>

              <span className="stage-badge">{item.estado}</span>
            </div>

            <div className="quote-values">
              <div>
                <span>Monto</span>
                <strong>${Number(item.monto || 0).toLocaleString("es-CL")}</strong>
              </div>

              <div>
                <span>Prob.</span>
                <strong>{item.probabilidad}%</strong>
              </div>

              <div>
                <span>Pond.</span>
                <strong>
                  ${Number(item.valorPonderado || 0).toLocaleString("es-CL")}
                </strong>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Proyeccion;
