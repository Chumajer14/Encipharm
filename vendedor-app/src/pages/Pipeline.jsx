import { useEffect, useState } from "react";
import { db } from "../db/dexie";
import { actualizarOportunidad, getOportunidades } from "../services/api";
import { useAppSettings } from "../settings/AppSettings";
import { ETAPAS, etapasColor, fromBackendStage, toBackendStage } from "../utils/etapas";

function mapBackendOpportunity(oportunidad) {
  return {
    id: `backend-${oportunidad.id}`,
    oportunidadId: oportunidad.id,
    cliente: oportunidad.titulo?.split(" - ")[0] || oportunidad.clienteId || "Cliente sin nombre",
    productoNombre: oportunidad.descripcion || oportunidad.titulo || "Oportunidad",
    monto: Number(oportunidad.valorEstimado || 0),
    probabilidad: Number(oportunidad.probabilidad || 0),
    valorPonderado: (Number(oportunidad.valorEstimado || 0) * Number(oportunidad.probabilidad || 0)) / 100,
    estado: fromBackendStage(oportunidad.etapa),
    sincronizada: true,
    source: "backend",
  };
}

function mergeCotizaciones(locales, remotas) {
  const remoteIds = new Set(remotas.map((item) => item.oportunidadId).filter(Boolean));
  const localOnly = locales
    .filter((item) => !item.oportunidadId || !remoteIds.has(item.oportunidadId))
    .map((item) => ({ ...item, source: "local", localId: item.id }));
  return [...remotas, ...localOnly];
}

async function loadCotizaciones(token) {
  const locales = await db.cotizaciones.toArray();
  try {
    const oportunidades = await getOportunidades(token);
    return {
      items: mergeCotizaciones(locales, oportunidades.map(mapBackendOpportunity)),
      message: "",
    };
  } catch (error) {
    console.error("Error cargando oportunidades:", error);
    return {
      items: locales.map((item) => ({ ...item, source: "local", localId: item.id })),
      message: "Mostrando datos locales. No se pudo sincronizar con backend.",
    };
  }
}

function Pipeline({ token }) {
  const { t } = useAppSettings();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const cargarCotizaciones = async () => {
    const result = await loadCotizaciones(token);
    setCotizaciones(result.items);
    setMensaje(result.message);
  };

  useEffect(() => {
    if (token) {
      loadCotizaciones(token).then((result) => {
        setCotizaciones(result.items);
        setMensaje(result.message);
      });
    }
  }, [token]);

  const cambiarEtapa = async (id, nuevaEtapa) => {
    setMensaje("");
    const cotizacion = cotizaciones.find((item) => item.id === id);

    if (cotizacion?.localId) {
      await db.cotizaciones.update(cotizacion.localId, {
        estado: nuevaEtapa,
        sincronizada: false,
      });
    }

    if (cotizacion?.oportunidadId) {
      try {
        await actualizarOportunidad(token, cotizacion.oportunidadId, {
          etapa: toBackendStage(nuevaEtapa),
        });
        if (cotizacion.localId) {
          await db.cotizaciones.update(cotizacion.localId, {
            sincronizada: true,
          });
        }
      } catch (error) {
        console.error("Error sincronizando etapa:", error);
        setMensaje(t("La etapa quedo local. Reintenta cuando el backend este disponible."));
      }
    }

    await cargarCotizaciones();
  };

  return (
    <main className="app-shell">
      <section className="page-title compact-title">
        <span className="eyebrow">{t("Pipeline")}</span>
        <h1>{t("Pipeline")}</h1>
        <p>{t("Seguimiento comercial del vendedor")}</p>
      </section>
      {mensaje && <p className="form-message">{mensaje}</p>}

      {ETAPAS.map((etapa) => {
        const items = cotizaciones.filter((item) => item.estado === etapa);

        return (
          <section className="pipeline-section" key={etapa}>
            <div className="pipeline-header">
              <div>
                <h2>{t(etapa)}</h2>
                <small>{items.length === 1 ? t("1 oportunidad") : `${items.length} ${t("oportunidades")}`}</small>
              </div>
              <span style={{ "--stage-color": etapasColor[etapa] }}>{items.length}</span>
            </div>

            <div className="pipeline-list">
              {items.length === 0 && (
                <article className="empty-card compact-empty">
                  <p>{t("Sin oportunidades en esta etapa.")}</p>
                </article>
              )}
              {items.map((item) => (
                <article className="pipeline-card" key={item.id}>
                  <div className="avatar" style={{ "--avatar-color": etapasColor[item.estado] }}>
                    {(item.cliente || "?").charAt(0)}
                  </div>
                  <h3>{item.cliente || t("Cliente sin nombre")}</h3>
                  <p>{item.productoNombre || t("Oportunidad")}</p>

                  <strong>
                    ${Number(item.monto || 0).toLocaleString("es-CL")}
                  </strong>

                  <small>{t("Probabilidad:")} {item.probabilidad}%</small>
                  {!item.sincronizada && <small>{t("Pendiente de sincronizar")}</small>}

                  <select
                    className="stage-select"
                    value={item.estado}
                    onChange={(event) => cambiarEtapa(item.id, event.target.value)}
                  >
                    {ETAPAS.map((opcion) => (
                      <option key={opcion} value={opcion}>
                        {t(opcion)}
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
