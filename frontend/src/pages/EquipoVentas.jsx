import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import { getOportunidades, getPropuestas, getUsers } from "../services/api";
import { buildSellerRows, compactMoney, initials, STAGE_LABELS, STAGES } from "../utils/commercialAnalytics";

function EquipoVentas() {
  const { idToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [propuestas, setPropuestas] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEquipo() {
      if (!idToken) return;
      try {
        const [opportunitiesData, proposalsData, usersData] = await Promise.all([
          getOportunidades(idToken),
          getPropuestas(idToken),
          getUsers(idToken).catch(() => []),
        ]);
        setOportunidades(opportunitiesData);
        setPropuestas(proposalsData);
        setUsers(usersData);
      } catch (loadError) {
        setError(loadError?.message || "No se pudo cargar el equipo.");
      }
    }

    loadEquipo();
  }, [idToken]);

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
          <div className="card-title"><span className="card-title-icon">MX</span>Matriz Vendedor x Etapa</div>
        </div>
        <div className="matrix-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Vendedor</th>
                {STAGES.map((stage) => <th key={stage}>{STAGE_LABELS[stage]}</th>)}
                <th>Total</th>
                <th>Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.uid}>
                  <td>
                    <div className="seller-cell">
                      <span className="seller-avatar">{initials(row.name)}</span>
                      <div><strong>{row.name}</strong><small>{row.email}</small></div>
                    </div>
                  </td>
                  {STAGES.map((stage) => <td key={stage}><span className="stage-count">{row.stageCounts[stage]}</span></td>)}
                  <td><strong>{row.total}</strong></td>
                  <td><strong>{compactMoney(row.pipeline)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <section className="empty-state"><h2>Sin vendedores con actividad</h2><p>La matriz se llenara con usuarios y oportunidades registradas.</p></section>}
      </section>
    </main>
  );
}

export default EquipoVentas;
