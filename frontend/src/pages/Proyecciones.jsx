import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import { getDashboardSupervisor, getDashboardVendedor, getOportunidades, getPropuestas, getUsers } from "../services/api";
import { buildSellerRows, compactMoney } from "../utils/commercialAnalytics";
import { isSupervisorRole } from "../auth/roles";

function Proyecciones() {
  const { backendUser, idToken } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [propuestas, setPropuestas] = useState([]);

  useEffect(() => {
    async function loadData() {
      if (!idToken) return;
      const isSupervisor = isSupervisorRole(backendUser?.rol || "vendedor");
      const [dashboardData, opportunitiesData, proposalsData, usersData] = await Promise.all([
        isSupervisor ? getDashboardSupervisor(idToken) : getDashboardVendedor(idToken),
        getOportunidades(idToken),
        getPropuestas(idToken),
        getUsers(idToken).catch(() => []),
      ]);
      setDashboard(dashboardData);
      setOportunidades(opportunitiesData);
      setPropuestas(proposalsData);
      setUsers(usersData);
    }

    loadData();
  }, [backendUser?.rol, idToken]);

  const rows = useMemo(
    () => buildSellerRows({ oportunidades, propuestas, users }),
    [oportunidades, propuestas, users],
  );
  const maxValue = Math.max(
    ...(dashboard?.forecastMensual || []).flatMap((point) => [point.proyeccionPonderada, point.ventaReal]),
    1,
  );

  return (
    <main className="page proyecciones-content">
      <section className="pipeline-header-bar">
        <div>
          <h2>Proyecciones</h2>
          <p className="sub">Analisis de ventas proyectadas vs realizadas por periodo y vendedor</p>
        </div>
        <div className="period-pills"><button className="period-pill active" type="button">3 Meses</button><button className="period-pill" type="button">6 Meses</button><button className="period-pill" type="button">1 Año</button></div>
      </section>

      <section className="card command-card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">PY</span>Venta del Mes - Proyectada vs Realizada</div>
        </div>
        <div className="area-chart-wrap">
          {(dashboard?.forecastMensual || []).map((point) => (
            <div className="area-point" key={point.etiqueta}>
              <div className="area-bars">
                <span className="bar projected" style={{ height: `${(point.proyeccionPonderada / maxValue) * 100}%` }} />
                <span className="bar real" style={{ height: `${(point.ventaReal / maxValue) * 100}%` }} />
              </div>
              <small>{point.etiqueta}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="proy-bottom">
        <article className="card command-card">
          <div className="card-header"><div className="card-title"><span className="card-title-icon">VD</span>Vendedores - Proyectado vs Realizado</div></div>
          <table className="proy-seller-table">
            <thead><tr><th>Vendedor</th><th>Proyectado</th><th>Realizado</th><th>Progreso</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const progress = row.projected > 0 ? Math.min((row.realized / row.projected) * 100, 100) : 0;
                return (
                  <tr key={row.uid}>
                    <td>{row.name}</td>
                    <td>{compactMoney(row.projected)}</td>
                    <td>{compactMoney(row.realized)}</td>
                    <td><div className="win-rate"><span className="win-rate-bar"><i style={{ width: `${progress}%` }} /></span>{Math.round(progress)}%</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </article>

        <article className="card command-card">
          <div className="card-header"><div className="card-title"><span className="card-title-icon">DT</span>Detalle comercial</div></div>
          <div className="accuracy-stats">
            <div className="acc-stat"><strong>{compactMoney(dashboard?.valorPropuestasAceptadas)}</strong><span>Realizado mes</span></div>
            <div className="acc-stat"><strong>{compactMoney(dashboard?.proyeccionPonderada)}</strong><span>Proyectado mes</span></div>
            <div className="acc-stat"><strong>{dashboard?.tasaConversionGlobal || 0}%</strong><span>Win rate</span></div>
          </div>
        </article>
      </section>
    </main>
  );
}

export default Proyecciones;
