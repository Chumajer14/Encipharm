import { useEffect, useState } from "react";
import { db } from "../db/dexie";
import { getOportunidades } from "../services/api";
import { useAppSettings } from "../settings/AppSettings";
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
  const { t } = useAppSettings();
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
        setMensaje(t("Mostrando datos locales. No se pudo sincronizar con backend."));
      }
    }

    if (token) {
      cargar();
    }
  }, [token, t]);

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
      <section className="page-title compact-title">
        <span className="eyebrow">{t("Forecast")}</span>
        <h1>{t("Proyeccion")}</h1>
        <p>{t("Forecast comercial del vendedor")}</p>
      </section>
      {mensaje && <p className="form-message">{mensaje}</p>}

      <section className="stats-grid">
        <article className="metric-card">
          <span>{t("Pipeline bruto")}</span>
          <strong>${totalPipeline.toLocaleString("es-CL")}</strong>
          <small>{cotizaciones.length} {t("cotizaciones activas")}</small>
        </article>

        <article className="metric-card success">
          <span>{t("Proyeccion ponderada")}</span>
          <strong>${totalPonderado.toLocaleString("es-CL")}</strong>
          <small>{t("Calculado por probabilidad")}</small>
        </article>
      </section>

      <section className="section-title">
        <h2>{t("Cotizaciones recientes")}</h2>
      </section>

      <section className="quote-list">
        {cotizaciones.length === 0 && (
          <article className="empty-card">
            <h3>{t("Sin cotizaciones")}</h3>
            <p>{t("Registra una cotizacion para calcular tu proyeccion.")}</p>
          </article>
        )}

        {cotizaciones.map((item) => (
          <article className="quote-card" key={item.id}>
            <div className="quote-header">
              <div>
                <h3>{item.cliente || t("Cliente sin nombre")}</h3>
                <p>{item.productoNombre || t("Producto no seleccionado")}</p>
              </div>

              <span className="stage-badge">{t(item.estado)}</span>
            </div>

            <div className="quote-values">
              <div>
                <span>{t("Monto")}</span>
                <strong>${Number(item.monto || 0).toLocaleString("es-CL")}</strong>
              </div>

              <div>
                <span>{t("Prob.")}</span>
                <strong>{item.probabilidad}%</strong>
              </div>

              <div>
                <span>{t("Pond.")}</span>
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
