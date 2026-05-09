import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { getOportunidadDetalle, updateOportunidad, updatePropuesta } from "../services/api";
import { getFriendlyApiError } from "../utils/apiErrors";

const etapas = ["nuevo", "contactado", "cotizacion", "negociacion", "ganado", "perdido"];
const estados = ["borrador", "enviada", "aceptada", "rechazada"];

function OportunidadDetalle() {
  const { oportunidadId } = useParams();
  const { idToken } = useAuth();
  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingOpportunity, setUpdatingOpportunity] = useState(false);
  const [updatingProposalId, setUpdatingProposalId] = useState("");

  useEffect(() => {
    async function loadDetalle() {
      if (!idToken || !oportunidadId) return;
      try {
        setLoading(true);
        setDetalle(await getOportunidadDetalle(idToken, oportunidadId));
      } catch (loadError) {
        setError(getFriendlyApiError(loadError));
      } finally {
        setLoading(false);
      }
    }

    loadDetalle();
  }, [idToken, oportunidadId]);

  const updateEtapa = async (etapa) => {
    setError("");
    try {
      setUpdatingOpportunity(true);
      const updated = await updateOportunidad(idToken, oportunidadId, { etapa });
      setDetalle({ ...detalle, oportunidad: updated });
    } catch (updateError) {
      setError(getFriendlyApiError(updateError));
    } finally {
      setUpdatingOpportunity(false);
    }
  };

  const updateEstadoPropuesta = async (propuesta, estado) => {
    setError("");
    try {
      setUpdatingProposalId(propuesta.id);
      const updated = await updatePropuesta(idToken, propuesta.id, { estado });
      setDetalle({
        ...detalle,
        propuestas: detalle.propuestas.map((item) => item.id === updated.id ? updated : item),
      });
    } catch (updateError) {
      setError(getFriendlyApiError(updateError));
    } finally {
      setUpdatingProposalId("");
    }
  };

  const oportunidad = detalle?.oportunidad;

  return (
    <main className="page">
      <section className="header header-row">
        <div>
          <h1>Detalle de Oportunidad</h1>
          <p>Seguimiento comercial, interacciones y propuestas vinculadas</p>
        </div>
        <Link to="/oportunidades"><button className="btn-secondary" type="button">Volver</button></Link>
      </section>

      {loading && <p className="status-message">Cargando oportunidad...</p>}
      {error && <section className="notice notice-error"><strong>Error</strong><span>{error}</span></section>}

      {oportunidad && (
        <>
          <section className="detail-grid">
            <article className="detail-panel">
              <h2>{oportunidad.titulo}</h2>
              <p>{oportunidad.descripcion || "Sin descripcion registrada."}</p>
              <dl>
                <div><dt>Valor estimado</dt><dd>${Number(oportunidad.valorEstimado || 0).toLocaleString()}</dd></div>
                <div><dt>Probabilidad</dt><dd>{oportunidad.probabilidad}%</dd></div>
                <div><dt>Etapa</dt><dd>{oportunidad.etapa}</dd></div>
              </dl>
              <label>Actualizar etapa
                <select value={oportunidad.etapa} disabled={updatingOpportunity} onChange={(event) => updateEtapa(event.target.value)}>
                  {etapas.map((etapa) => <option key={etapa} value={etapa}>{etapa}</option>)}
                </select>
              </label>
            </article>

            <article className="detail-panel">
              <h2>Propuestas vinculadas</h2>
              {detalle.propuestas.length === 0 && <p className="muted-text">Sin propuestas vinculadas.</p>}
              {detalle.propuestas.map((propuesta) => (
                <div className="timeline-item" key={propuesta.id}>
                  <strong>{propuesta.titulo}</strong>
                  <span>${Number(propuesta.montoTotal || 0).toLocaleString()}</span>
                  <select value={propuesta.estado} disabled={updatingProposalId === propuesta.id} onChange={(event) => updateEstadoPropuesta(propuesta, event.target.value)}>
                    {estados.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                  </select>
                </div>
              ))}
            </article>
          </section>

          <section className="detail-panel">
            <h2>Historial de interacciones del cliente</h2>
            {detalle.interacciones.length === 0 && <p className="muted-text">Sin interacciones registradas.</p>}
            <div className="timeline-list">
              {detalle.interacciones.map((interaccion) => (
                <article className="timeline-item" key={interaccion.id}>
                  <strong>{interaccion.tipo}</strong>
                  <span>{new Date(interaccion.fecha).toLocaleString()}</span>
                  <p>{interaccion.resumen}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default OportunidadDetalle;
