import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import LoadingState from "../components/LoadingState";
import useCachedQuery from "../hooks/useCachedQuery";
import { getOportunidades, getPropuestas, getUsers } from "../services/api";
import { buildSellerRows, initials, money, STAGES } from "../utils/commercialAnalytics";

const TEAM_STAGE_LABELS = {
  nuevo: "Prospeccion",
  contactado: "Calificacion",
  cotizacion: "Propuesta",
  negociacion: "Negociacion",
  ganado: "Cierre",
};

const TEAM_STAGE_COLORS = {
  nuevo: "blue",
  contactado: "violet",
  cotizacion: "warning",
  negociacion: "orange",
  ganado: "success",
};

const AVATAR_COLORS = ["#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6", "#6366f1"];

function EquipoVentas() {
  const { idToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [propuestas, setPropuestas] = useState([]);
  const equipoQuery = useCachedQuery(
    "equipo-ventas:dataset",
    async () => {
      const [opportunitiesData, proposalsData, usersData] = await Promise.all([
        getOportunidades(idToken),
        getPropuestas(idToken),
        getUsers(idToken).catch(() => []),
      ]);
      return { oportunidades: opportunitiesData, propuestas: proposalsData, users: usersData };
    },
    { enabled: Boolean(idToken), initialData: null },
  );
  const loading = equipoQuery.loading;
  const error = equipoQuery.error;

  useEffect(() => {
    if (!equipoQuery.data) return;
    queueMicrotask(() => {
      setOportunidades(equipoQuery.data.oportunidades);
      setPropuestas(equipoQuery.data.propuestas);
      setUsers(equipoQuery.data.users);
    });
  }, [equipoQuery.data]);

  const rows = useMemo(
    () => buildSellerRows({ oportunidades, propuestas, users }),
    [oportunidades, propuestas, users],
  );

  return (
    <main className="page equipo-content">
      <section className="pipeline-header-bar">
        <div>
          <h2>Equipo de Ventas</h2>
          <p className="sub">Resumen de oportunidades por vendedor y etapa del funnel</p>
        </div>
      </section>

      {error && <section className="notice notice-error"><strong>Error</strong><span>{error}</span></section>}

      <section className="card command-card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">#</span>Matriz Vendedor x Etapa</div>
        </div>
        <div className="matrix-wrap">
          {!loading && <table className="team-matrix-table">
            <thead>
              <tr>
                <th>Vendedor</th>
                {STAGES.map((stage) => (
                  <th key={stage}>
                    <span className={`team-stage-pill ${TEAM_STAGE_COLORS[stage]}`}>
                      <i />
                      {TEAM_STAGE_LABELS[stage]}
                    </span>
                  </th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.uid}>
                  <td>
                    <div className="seller-cell">
                      <span className="seller-avatar" style={{ background: AVATAR_COLORS[rowIndex % AVATAR_COLORS.length] }}>{initials(row.name)}</span>
                      <div><strong>{row.name}</strong><small>{row.zone}</small></div>
                    </div>
                  </td>
                  {STAGES.map((stage) => {
                    const stageValue = row.stageValues?.[stage] || 0;
                    const stageCount = row.stageCounts?.[stage] || 0;
                    return (
                      <td className="team-stage-cell" key={stage}>
                        {stageCount > 0 ? (
                          <>
                            <strong>{money(stageValue)}</strong>
                            <small>{stageCount} opp.</small>
                          </>
                        ) : (
                          <span className="team-empty-cell">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="team-total-cell">
                    <strong>{money(row.pipeline)}</strong>
                    <small>{row.total} opps.</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
        </div>
        {loading && <LoadingState />}
        {!loading && rows.length === 0 && <section className="empty-state"><h2>Sin vendedores con actividad</h2><p>La matriz se llenara con usuarios y oportunidades registradas.</p></section>}
      </section>
    </main>
  );
}

export default EquipoVentas;
