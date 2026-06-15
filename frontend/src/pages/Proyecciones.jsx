import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import { isSupervisorRole } from "../auth/roles";
import LoadingState from "../components/LoadingState";
import useCachedQuery from "../hooks/useCachedQuery";
import { getClientes, getOportunidades, getPropuestas, getUsers } from "../services/api";
import { buildSellerRows, initials, money, weightedValue } from "../utils/commercialAnalytics";

const PERIODS = [
  { key: "3m", label: "3 Meses", months: 3 },
  { key: "6m", label: "6 Meses", months: 6 },
  { key: "1y", label: "1 Ano", months: 12 },
];

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const AVATAR_COLORS = [
  "linear-gradient(135deg,#10b981,#34d399)",
  "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  "linear-gradient(135deg,#f59e0b,#fbbf24)",
  "linear-gradient(135deg,#ef4444,#fb7185)",
  "linear-gradient(135deg,#3b82f6,#60a5fa)",
];
const CHART_W = 960;
const CHART_H = 260;
const PAD = { left: 64, right: 24, top: 20, bottom: 40 };
const CIRCUMFERENCE = 226.19;

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function recordDate(record) {
  return parseDate(record?.updatedAt) || parseDate(record?.createdAt) || parseDate(record?.fecha) || null;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonths(count) {
  const base = new Date();
  base.setDate(1);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(base.getFullYear(), base.getMonth() - (count - index - 1), 1);
    return { key: monthKey(date), label: MONTHS[date.getMonth()] };
  });
}

function buildChartSeries({ months, oportunidades, propuestas }) {
  return months.map((month) => {
    const projected = oportunidades
      .filter((item) => {
        const date = recordDate(item);
        return date && monthKey(date) === month.key;
      })
      .reduce((sum, item) => sum + weightedValue(item), 0);
    const realized = propuestas
      .filter((item) => {
        const date = recordDate(item);
        return item.estado === "aceptada" && date && monthKey(date) === month.key;
      })
      .reduce((sum, item) => sum + Number(item.montoTotal || 0), 0);
    return {
      ...month,
      projected,
      realized,
      target: Math.max(projected, realized) * 1.06,
    };
  });
}

function formatDealDate(value) {
  const date = recordDate(value);
  if (!date) return "Sin fecha";
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function pathPoints(points, x, y, key) {
  return points.map((point, index) => `${x(index)},${y(point[key])}`).join(" ");
}

function areaPoints(points, x, y, key) {
  const last = points.length - 1;
  return `${pathPoints(points, x, y, key)} ${x(last)},${CHART_H - PAD.bottom} ${x(0)},${CHART_H - PAD.bottom}`;
}

function ProyAreaChart({ points }) {
  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const maxValue = Math.max(...points.flatMap((point) => [point.projected, point.realized, point.target]), 1) * 1.12;
  const x = (index) => PAD.left + (points.length === 1 ? 0 : (index / (points.length - 1)) * plotW);
  const y = (value) => PAD.top + plotH - (value / maxValue) * plotH;
  const ticks = Array.from({ length: 6 }, (_, index) => {
    const value = maxValue * (1 - index / 5);
    return {
      label: value >= 1000000 ? `$${(value / 1000000).toFixed(0)}M` : `$${(value / 1000).toFixed(0)}K`,
      y: PAD.top + (index / 5) * plotH,
    };
  });

  return (
    <div className="area-chart-wrap">
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="gradProj" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradReal" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick.y}>
            <text x="4" y={tick.y} dy="0.35em" fill="#5c5c6d" fontSize="10" fontFamily="JetBrains Mono, monospace">{tick.label}</text>
            <line x1={PAD.left} y1={tick.y} x2={CHART_W - PAD.right} y2={tick.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          </g>
        ))}
        {points.map((point, index) => (
          <text key={point.key} x={x(index)} y={CHART_H - 8} textAnchor="middle" fill="#5c5c6d" fontSize="11" fontFamily="Outfit, sans-serif">{point.label}</text>
        ))}
        <polygon className="area-fill projected" points={areaPoints(points, x, y, "projected")} />
        <polygon className="area-fill real" points={areaPoints(points, x, y, "realized")} />
        <polyline className="area-line target" points={pathPoints(points, x, y, "target")} />
        <polyline className="area-line projected" points={pathPoints(points, x, y, "projected")} />
        <polyline className="area-line real" points={pathPoints(points, x, y, "realized")} />
        {points.map((point, index) => (
          <g key={`dot-${point.key}`}>
            <circle className="chart-dot projected" cx={x(index)} cy={y(point.projected)} r="3.5" />
            <circle className="chart-dot real" cx={x(index)} cy={y(point.realized)} r="3.5" />
          </g>
        ))}
      </svg>
    </div>
  );
}

function progressColor(progress) {
  if (progress >= 80) return "success";
  if (progress >= 60) return "warning";
  return "danger";
}

function Proyecciones() {
  const { backendUser, idToken } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [users, setUsers] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [propuestas, setPropuestas] = useState([]);
  const [period, setPeriod] = useState("3m");
  const [selectedSellerUid, setSelectedSellerUid] = useState("");
  const isSupervisorView = isSupervisorRole(backendUser?.rol);
  const proyeccionesQuery = useCachedQuery(
    `proyecciones:dataset:${backendUser?.uid || "anon"}:${backendUser?.rol || "sin_acceso"}`,
    async () => {
      const [clientesData, opportunitiesData, proposalsData, usersData] = await Promise.all([
        getClientes(idToken),
        getOportunidades(idToken),
        getPropuestas(idToken),
        getUsers(idToken).catch(() => []),
      ]);
      const users = usersData.length ? usersData : [backendUser];
      return { clientes: clientesData, oportunidades: opportunitiesData, propuestas: proposalsData, users };
    },
    { enabled: Boolean(idToken && backendUser?.uid), initialData: null },
  );
  const loading = proyeccionesQuery.loading;
  const error = proyeccionesQuery.error;

  useEffect(() => {
    if (!proyeccionesQuery.data) return;
    queueMicrotask(() => {
      setClientes(proyeccionesQuery.data.clientes);
      setOportunidades(proyeccionesQuery.data.oportunidades);
      setPropuestas(proyeccionesQuery.data.propuestas);
      setUsers(proyeccionesQuery.data.users);
    });
  }, [proyeccionesQuery.data]);

  const rows = useMemo(
    () => {
      const sellerRows = buildSellerRows({ oportunidades, propuestas, users });
      return isSupervisorView ? sellerRows : sellerRows.filter((row) => row.uid === backendUser?.uid);
    },
    [backendUser?.uid, isSupervisorView, oportunidades, propuestas, users],
  );

  const effectiveSelectedSellerUid = !isSupervisorView
    ? rows[0]?.uid || ""
    : rows.some((row) => row.uid === selectedSellerUid)
      ? selectedSellerUid
      : rows[0]?.uid || "";
  const selectedSeller = rows.find((row) => row.uid === effectiveSelectedSellerUid);
  const periodConfig = PERIODS.find((item) => item.key === period) || PERIODS[0];
  const chartPoints = useMemo(
    () => buildChartSeries({ months: buildMonths(periodConfig.months), oportunidades, propuestas }),
    [oportunidades, periodConfig.months, propuestas],
  );
  const clientsById = useMemo(() => new Map(clientes.map((cliente) => [cliente.id, cliente])), [clientes]);
  const proposalsByOpportunity = useMemo(() => new Map(propuestas.map((proposal) => [proposal.oportunidadId, proposal])), [propuestas]);

  const selectedDetails = useMemo(() => {
    if (!selectedSeller) return null;
    const closedDeals = selectedSeller.accepted.map((proposal) => ({
      id: proposal.id,
      client: clientsById.get(proposal.clienteId)?.empresa || clientsById.get(proposal.clienteId)?.nombre || proposal.clienteId,
      project: proposal.titulo,
      date: formatDealDate(proposal),
      value: Number(proposal.montoTotal || 0),
    }));
    const negotiationDeals = selectedSeller.negotiating.map((opportunity) => ({
      id: opportunity.id,
      client: clientsById.get(opportunity.clienteId)?.empresa || clientsById.get(opportunity.clienteId)?.nombre || opportunity.clienteId,
      project: proposalsByOpportunity.get(opportunity.id)?.titulo || opportunity.titulo,
      date: formatDealDate(opportunity),
      value: Number(opportunity.valorEstimado || 0),
    }));
    const negotiationTotal = negotiationDeals.reduce((sum, deal) => sum + deal.value, 0);
    const accuracy = selectedSeller.projected > 0
      ? Math.min(Math.round((selectedSeller.realized / selectedSeller.projected) * 100), 100)
      : 0;
    return { accuracy, closedDeals, negotiationDeals, negotiationTotal };
  }, [clientsById, proposalsByOpportunity, selectedSeller]);

  return (
    <main className="page proyecciones-content">
      <section className="pipeline-header-bar">
        <div>
          <h2>Proyecciones</h2>
          <p className="sub">Analisis de ventas proyectadas vs realizadas por periodo y vendedor</p>
        </div>
        <div className="period-pills">
          {PERIODS.map((item) => (
            <button
              className={`period-pill ${period === item.key ? "active" : ""}`}
              key={item.key}
              onClick={() => setPeriod(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {error && <section className="notice notice-error"><strong>Error</strong><span>{error}</span></section>}

      {loading && <LoadingState />}

      {!loading && <section className="card command-card proy-chart-card">
        <div className="card-header">
          <div className="card-title">
            <span className="card-title-icon" aria-hidden="true">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </span>
            Venta del Mes - Proyectada vs Realizada
          </div>
          <div className="chart-legend proy-legend">
            <span><i className="legend-projected" />Proyectada</span>
            <span><i className="legend-real" />Realizada</span>
            <span><i className="legend-target" />Meta</span>
          </div>
        </div>
        <div className="card-body">
          <ProyAreaChart points={chartPoints} />
        </div>
      </section>}

      {!loading && <section className="proy-bottom">
        <article className="card command-card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-icon" aria-hidden="true">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" /></svg>
              </span>
              {isSupervisorView ? "Vendedores - Proyectado vs Realizado" : "Mi estado - Proyectado vs Realizado"}
            </div>
          </div>
          <div className="card-body proy-table-body">
            <table className="proy-seller-table">
              <thead><tr><th>Vendedor</th><th className="r">Proyectado</th><th className="r">Realizado</th><th>Progreso</th></tr></thead>
              <tbody>
                {rows.map((row, index) => {
                  const progress = row.projected > 0 ? Math.min((row.realized / row.projected) * 100, 100) : 0;
                  const color = progressColor(progress);
                  return (
                    <tr className={`seller-row ${effectiveSelectedSellerUid === row.uid ? "selected" : ""}`} key={row.uid} onClick={() => setSelectedSellerUid(row.uid)}>
                      <td>
                        <div className="seller-cell">
                          <span className="seller-avatar" style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}>{initials(row.name)}</span>
                          <span className="seller-info"><strong>{row.name}</strong><small>{users.find((user) => user.uid === row.uid)?.cargo || "Vendedor"}</small></span>
                        </div>
                      </td>
                      <td className="r mono">{money(row.projected)}</td>
                      <td className={`r mono amount-${color}`}>{money(row.realized)}</td>
                      <td>
                        <div className="dual-bar">
                          <span className="dual-bar-track">
                            <i className="dual-bar-proj" />
                            <i className={`dual-bar-real ${color}`} style={{ width: `${progress}%` }} />
                          </span>
                          <span className="dual-bar-label">{Math.round(progress)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card command-card proy-detail-card">
          <div className="card-header">
            <div className="card-title">
              <span className="card-title-icon" aria-hidden="true">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 12 2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              </span>
              {selectedSeller?.name || "Detalle del Vendedor"}
            </div>
          </div>
          <div className="card-body proy-detail-body">
            {!selectedSeller && (
              <div className="detail-placeholder">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M15 5v2m0 0v5m0-5h5m-5 0H10M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                Selecciona un vendedor de la tabla izquierda
              </div>
            )}
            {selectedSeller && selectedDetails && (
              <div className="detail-panel visible" key={selectedSeller.uid}>
                <div className="accuracy-row">
                  <div className="gauge-wrap">
                    <svg viewBox="0 0 90 90">
                      <circle className="gauge-bg" cx="45" cy="45" r="36" />
                      <circle
                        className={`gauge-fill ${progressColor(selectedDetails.accuracy)}`}
                        cx="45"
                        cy="45"
                        r="36"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={CIRCUMFERENCE - (selectedDetails.accuracy / 100) * CIRCUMFERENCE}
                      />
                    </svg>
                    <div className="gauge-text"><strong>{selectedDetails.accuracy}%</strong><span>Indice</span></div>
                  </div>
                  <div className="accuracy-stats proy-accuracy-stats">
                    <div className="acc-stat"><strong>{money(selectedSeller.realized)}</strong><span>Realizado (mes)</span></div>
                    <div className="acc-stat"><strong>{money(selectedSeller.projected)}</strong><span>Proyectado (mes)</span></div>
                    <div className="acc-stat"><strong>{money(selectedDetails.negotiationTotal)}</strong><span>En negociacion</span></div>
                    <div className="acc-stat"><strong>{selectedSeller.winRate}%</strong><span>Win Rate historico</span></div>
                  </div>
                </div>

                <div>
                  <div className="detail-section-title">Ventas cerradas este mes</div>
                  <div className="deal-list">
                    {selectedDetails.closedDeals.length === 0 && <p className="deal-empty">Sin ventas cerradas registradas.</p>}
                    {selectedDetails.closedDeals.map((deal) => (
                      <div className="deal-row" key={deal.id}>
                        <span className="deal-dot won" />
                        <span className="deal-info"><strong>{deal.client}</strong><small>{deal.project} - {deal.date}</small></span>
                        <span className="deal-val won">{money(deal.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="detail-section-title">En estado de negociacion</div>
                  <div className="deal-list">
                    {selectedDetails.negotiationDeals.length === 0 && <p className="deal-empty">Sin oportunidades en negociacion.</p>}
                    {selectedDetails.negotiationDeals.map((deal) => (
                      <div className="deal-row" key={deal.id}>
                        <span className="deal-dot neg" />
                        <span className="deal-info"><strong>{deal.client}</strong><small>{deal.project} - {deal.date}</small></span>
                        <span className="deal-val neg">{money(deal.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </article>
      </section>}
    </main>
  );
}

export default Proyecciones;
