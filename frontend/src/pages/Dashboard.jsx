import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { isSupervisorRole } from "../auth/roles";
import LoadingState from "../components/LoadingState";
import useCachedQuery from "../hooks/useCachedQuery";
import { getClientes, getDashboardVendedor, getDashboardSupervisor, getOportunidades, getPropuestas, getUsers } from "../services/api";
import { buildSellerRows, compactMoney, money, STAGE_LABELS, STAGES, weightedValue } from "../utils/commercialAnalytics";
import {
  buildForecastFilename,
  buildForecastMetadata,
  buildForecastSeries,
  calculateForecastTarget,
  downloadCsv,
  enrichForecastSeries,
  serializeAnalyticalForecastCsv,
  serializeSimpleForecastCsv,
  summarizeForecast,
} from "../utils/forecastExport";

function getCount(items = [], key) {
  return items.find((item) => item.clave === key)?.total ?? 0;
}

function formatCompactMoney(value) {
  const amount = Number(value || 0);

  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }

  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }

  return `$${amount.toLocaleString("es-CL")}`;
}

const KPI_ICON_PATHS = {
  money: [
    "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1",
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  ],
  conversion: [
    "M9 12l2 2 4-4",
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  ],
  ticket: [
    "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01",
    "M7 21h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z",
  ],
  location: [
    "M17.657 16.657 13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z",
    "M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  ],
};

function KpiIcon({ name }) {
  return (
    <svg aria-hidden="true" width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {(KPI_ICON_PATHS[name] || KPI_ICON_PATHS.money).map((path) => (
        <path key={path} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
      ))}
    </svg>
  );
}

const PANEL_ICON_PATHS = {
  forecast: ["M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"],
  funnel: ["M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"],
  download: ["M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"],
  team: ["M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"],
  alert: ["M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"],
};

const ALERT_ICON_PATHS = {
  critical: ["M12 8v4m0 4h.01", "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"],
  warning: ["M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"],
  info: ["M9 12l2 2 4-4", "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"],
};

function PanelSvgIcon({ name }) {
  return (
    <svg aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {(PANEL_ICON_PATHS[name] || PANEL_ICON_PATHS.team).map((path) => (
        <path key={path} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
      ))}
    </svg>
  );
}

function AlertGlyph({ type }) {
  const paths = ALERT_ICON_PATHS[type] || ALERT_ICON_PATHS.warning;
  return (
    <svg aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {paths.map((path) => (
        <path key={path} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
      ))}
    </svg>
  );
}

function NotOperationalModal({ onClose }) {
  return (
    <div className="not-operational-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-labelledby="dashboard-map-modal-title"
        aria-modal="true"
        className="not-operational-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="not-operational-close" type="button" aria-label="Cerrar" onClick={onClose}>
          X
        </button>
        <div className="not-operational-mark" aria-hidden="true">X</div>
        <h2 id="dashboard-map-modal-title">No operativo.</h2>
      </section>
    </div>
  );
}

function KpiCard({ accent = "violet", helper, icon, label, metaLeft, metaRight, progress = 60, trend, value }) {
  return (
    <article className={`command-kpi ${accent}`}>
      <div className="command-kpi-header">
        <span className="command-kpi-icon"><KpiIcon name={icon} /></span>
        {trend && <span className={`command-kpi-trend ${trend.startsWith("-") ? "down" : "up"}`}>{trend}</span>}
      </div>
      <strong>{value}</strong>
      <p>{label}</p>
      {helper && <small>{helper}</small>}
      <div className="kpi-progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="kpi-meta">
        <span>{metaLeft}</span>
        <span>{metaRight}</span>
      </div>
    </article>
  );
}

export function ForecastChart({
  canFilterSeller,
  exportMessage,
  exportOpen,
  exporting,
  forecast = [],
  mode,
  onDownload,
  onExportToggle,
  onModeChange,
  onSellerChange,
  selectedSeller,
  sellerOptions,
  targetValue = 0,
}) {
  const fallbackPoints = Array.from({ length: 5 }, (_, index) => ({
      etiqueta: `Sem ${index + 1}`,
      proyeccionPonderada: 0,
      ventaReal: 0,
    }));
  const points = forecast.length > 0 ? forecast : fallbackPoints;
  const hasData = points.some((point) => Number(point.proyeccionPonderada || 0) > 0 || Number(point.ventaReal || 0) > 0);
  const maxValue = Math.max(
    targetValue,
    ...points.flatMap((point) => [point.proyeccionPonderada, point.ventaReal]),
    1,
  );
  const target = formatCompactMoney(targetValue);
  const axisValues = [1, 0.75, 0.5, 0.25, 0].map((factor) => formatCompactMoney(maxValue * factor));

  return (
    <article className="command-panel forecast-panel">
      <div className="command-panel-header">
        <div className="panel-title">
          <span className="panel-icon violet"><PanelSvgIcon name="forecast" /></span>
          <h2>Forecast vs Real (Ponderado)</h2>
        </div>
        <div className="panel-actions">
          {canFilterSeller && (
            <select
              aria-label="Filtrar forecast por vendedor"
              className="forecast-seller-select"
              onChange={(event) => onSellerChange(event.target.value)}
              value={selectedSeller}
            >
              <option value="">Equipo completo</option>
              {sellerOptions.map((seller) => <option key={seller.uid} value={seller.uid}>{seller.name}</option>)}
            </select>
          )}
          <button className={mode === "semanal" ? "active" : ""} onClick={() => onModeChange("semanal")} type="button">Semanal</button>
          <button className={mode === "mensual" ? "active" : ""} onClick={() => onModeChange("mensual")} type="button">Mensual</button>
          <div className="forecast-export-control">
            <button
              aria-expanded={exportOpen}
              aria-haspopup="menu"
              className="icon-action forecast-export-trigger"
              disabled={!hasData || exporting}
              onClick={onExportToggle}
              title="Incluye forecast, real, meta, brechas y filtros aplicados"
              type="button"
            >
              <PanelSvgIcon name="download" />
              <span>{exporting ? "Generando..." : "Exportar"}</span>
            </button>
            {exportOpen && (
              <div className="forecast-export-menu" role="menu">
                <strong>Descargar forecast actual</strong>
                <p>Respeta la vista, vendedor y período visibles.</p>
                <button onClick={() => onDownload("analitico")} role="menuitem" type="button">
                  <span>CSV analítico</span>
                  <small>Metadata, resumen, meta, brechas y cumplimiento</small>
                </button>
                <button onClick={() => onDownload("simple")} role="menuitem" type="button">
                  <span>CSV simple</span>
                  <small>Periodo, forecast ponderado y venta real</small>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!hasData && <p className="forecast-export-feedback muted">No hay datos en la vista actual para exportar.</p>}
      {exportMessage && <p className="forecast-export-feedback" role="status">{exportMessage}</p>}

      <div className="chart-legend">
        <span><i className="legend-projected" />Proyeccion Ponderada</span>
        <span><i className="legend-real" />Venta Real</span>
        <span><i className="legend-target" />Meta del Mes</span>
      </div>

      <div className="forecast-chart">
        <div className="chart-axis">
          {axisValues.map((label) => <span key={label}>{label}</span>)}
        </div>
        <div className="chart-area">
          <div className="target-line"><span>Meta: {target}</span></div>
          {points.map((point) => {
            const projectedHeight = Math.round((Number(point.proyeccionPonderada || 0) / maxValue) * 100);
            const realHeight = Math.round((Number(point.ventaReal || 0) / maxValue) * 100);

            return (
            <div className="bar-group" key={point.etiqueta}>
              <div className="bar-pair">
                <span
                  className="bar projected"
                  title={`Proyeccion: ${formatCompactMoney(point.proyeccionPonderada)}`}
                  style={{ height: `${projectedHeight}%` }}
                />
                <span
                  className="bar real"
                  title={`Venta real: ${formatCompactMoney(point.ventaReal)}`}
                  style={{ height: `${realHeight}%` }}
                />
              </div>
              <small>{point.etiqueta}</small>
            </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

const DASHBOARD_FUNNEL_LABELS = {
  nuevo: "Prospeccion",
  contactado: "Calificacion",
  cotizacion: "Propuesta Enviada",
  negociacion: "En Negociacion",
  ganado: "Cierre",
};

const DASHBOARD_FUNNEL_VISUALS = {
  nuevo: { color: "blue", icon: "🎯" },
  contactado: { color: "violet", icon: "⭐" },
  cotizacion: { color: "warning", icon: "📄" },
  negociacion: { color: "orange", icon: "🤝" },
  ganado: { color: "success", icon: "✅" },
};

const COMPANY_ZONES = ["Zona norte", "Zona centro", "Zona sur"];

function normalizeCompanyZone(region) {
  const value = String(region || "").trim().toLowerCase();
  if (!value) return "Zona centro";

  if (value.includes("norte")) return "Zona norte";
  if (value.includes("sur")) return "Zona sur";
  if (value.includes("centro") || value.includes("oriente")) return "Zona centro";

  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    normalized.includes("arica")
    || normalized.includes("parinacota")
    || normalized.includes("tarapaca")
    || normalized.includes("antofagasta")
    || normalized.includes("atacama")
    || normalized.includes("coquimbo")
  ) {
    return "Zona norte";
  }

  if (
    normalized.includes("araucania")
    || normalized.includes("los rios")
    || normalized.includes("rios")
    || normalized.includes("los lagos")
    || normalized.includes("lagos")
    || normalized.includes("aysen")
    || normalized.includes("magallanes")
  ) {
    return "Zona sur";
  }

  return "Zona centro";
}

function buildFunnelStages(oportunidades = []) {
  const stageTotals = STAGES.map((stage) => oportunidades.filter((item) => item.etapa === stage).length);
  const maxTotal = Math.max(...stageTotals, 1);
  let previousTotal = null;
  return STAGES.map((stage) => {
    const stageItems = oportunidades.filter((item) => item.etapa === stage);
    const total = stageItems.length;
    const changePct = previousTotal === null || previousTotal === 0
      ? 0
      : ((total - previousTotal) / previousTotal) * 100;
    const fugaPct = changePct < 0 ? Math.abs(changePct) : 0;
    const value = stageItems.reduce((sum, item) => sum + Number(item.valorEstimado || 0), 0);
    previousTotal = total;
    return {
      clave: stage,
      nombre: DASHBOARD_FUNNEL_LABELS[stage] || STAGE_LABELS[stage],
      total,
      valorEstimado: value,
      conversionPct: (total / maxTotal) * 100,
      fugaPct,
      changePct,
    };
  });
}

function formatFunnelChange(stage, index) {
  if (index === 0) return { className: "neutral", label: "Leads nuevos" };
  if (stage.clave === "ganado") return { className: "positive", label: formatCompactMoney(stage.valorEstimado) };

  const change = Number(stage.changePct || 0);
  if (change > 0) {
    return {
      className: "positive",
      label: `+${Math.round(change).toLocaleString("es-CL")}% avance`,
    };
  }

  return {
    className: change < 0 ? "negative" : "neutral",
    label: `-${Math.round(Math.abs(change)).toLocaleString("es-CL")}% fuga`,
  };
}

function FunnelStageDetailModal({ clientsById, onClose, opportunities, stage }) {
  const rows = opportunities.filter((item) => item.etapa === stage?.clave);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="opportunity-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="opportunity-modal funnel-detail-modal" role="dialog" aria-modal="true" aria-labelledby="funnel-detail-title">
        <button className="opportunity-modal-close" type="button" onClick={onClose}>X</button>
        <header className="opportunity-modal-header">
          <h2 id="funnel-detail-title">{stage?.nombre || "Detalle del embudo"}</h2>
          <p>{rows.length} clientes en el estado seleccionado</p>
        </header>
        <div className="pipeline-table-wrap funnel-detail-table-wrap">
          <table className="pipeline-table">
            <thead>
              <tr>
                <th>Cliente / Proyecto</th>
                <th className="text-right">Valor Propuesta</th>
                <th>Probabilidad</th>
                <th className="text-right">Valor Pond.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const client = clientsById.get(item.clienteId);
                const probability = Math.max(0, Math.min(Number(item.probabilidad || 0), 100));
                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{client?.empresa || client?.nombre || item.clienteId}</strong>
                      <small>{item.titulo}</small>
                    </td>
                    <td className="td-right">{money(item.valorEstimado)}</td>
                    <td>
                      <div className="probability-cell">
                        <span className="probability-bar"><i style={{ width: `${probability}%` }} /></span>
                        <small>{probability}%</small>
                      </div>
                    </td>
                    <td className="td-right">{money(weightedValue(item))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <section className="empty-state pipeline-empty-state"><h2>Sin clientes en este estado</h2></section>}
        </div>
      </section>
    </div>
  );
}

function SalesFunnel({ onStageSelect, onZoneChange, selectedZone, stages = [] }) {
  const fallbackStages = STAGES.map((stage) => ({
      clave: stage,
      nombre: DASHBOARD_FUNNEL_LABELS[stage],
      total: 0,
      conversionPct: 0,
      fugaPct: 0,
      changePct: 0,
      valorEstimado: 0,
    }));
  const visibleStages = stages.length > 0 ? stages : fallbackStages;

  return (
    <article className="command-panel funnel-panel">
      <div className="command-panel-header">
        <div className="panel-title">
          <span className="panel-icon violet"><PanelSvgIcon name="funnel" /></span>
          <h2>Embudo de Ventas</h2>
        </div>
        <select className="panel-filter funnel-scope-select" onChange={(event) => onZoneChange(event.target.value)} value={selectedZone}>
          <option value="">Todas las empresas</option>
          {COMPANY_ZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
        </select>
      </div>

      <div className="funnel-list">
        {visibleStages.map((stage, index) => {
          const visual = DASHBOARD_FUNNEL_VISUALS[stage.clave] || DASHBOARD_FUNNEL_VISUALS.nuevo;
          const metric = formatFunnelChange(stage, index);

          return (
          <button className={`funnel-stage ${visual.color}`} key={stage.clave || stage.nombre} onClick={() => onStageSelect(stage)} type="button">
            <span className="funnel-icon">{visual.icon}</span>
            <div className="funnel-info">
              <strong>{stage.nombre}</strong>
              <div className="funnel-bar">
                <span style={{ width: `${Math.min(stage.conversionPct || 0, 100)}%` }} />
              </div>
            </div>
            <div className="funnel-metric">
              <strong>{stage.total}</strong>
              <small className={metric.className}>{metric.label}</small>
            </div>
          </button>
          );
        })}
      </div>
    </article>
  );
}

function Dashboard() {
  const { idToken, backendUser } = useAuth();
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [users, setUsers] = useState([]);
  const [sellerRows, setSellerRows] = useState([]);
  const [activityAlerts, setActivityAlerts] = useState([]);
  const [forecastMode, setForecastMode] = useState("mensual");
  const [forecastSellerUid, setForecastSellerUid] = useState("");
  const [forecastExportOpen, setForecastExportOpen] = useState(false);
  const [forecastExporting, setForecastExporting] = useState(false);
  const [forecastExportMessage, setForecastExportMessage] = useState("");
  const [selectedFunnelZone, setSelectedFunnelZone] = useState("");
  const [selectedFunnelStage, setSelectedFunnelStage] = useState(null);
  const [showMapUnavailable, setShowMapUnavailable] = useState(false);

  const rol = backendUser?.rol || "vendedor";
  const isSupervisorView = isSupervisorRole(rol);
  const dashboardQuery = useCachedQuery(
    `dashboard:${backendUser?.uid || "anon"}:${rol}`,
    async () => {
      const [response, clientsData, opportunitiesData, proposalsData, usersData] = await Promise.all([
        isSupervisorView ? getDashboardSupervisor(idToken) : getDashboardVendedor(idToken),
        getClientes(idToken),
        getOportunidades(idToken),
        getPropuestas(idToken),
        getUsers(idToken).catch(() => []),
      ]);
      const users = usersData.length ? usersData : [backendUser];
      return { clients: clientsData, opportunities: opportunitiesData, proposals: proposalsData, response, users };
    },
    { enabled: Boolean(idToken && backendUser?.uid), initialData: null },
  );
  const loading = dashboardQuery.loading;
  const error = dashboardQuery.error;
  const pipelineValue = Number(data?.valorPipeline || 0);
  const acceptedValue = Number(data?.valorPropuestasAceptadas || 0);
  const conversionRate = Number(data?.tasaConversionGlobal || 0);
  const averageTicket = Number(data?.ticketPromedio || 0);
  const weightedForecast = Number(data?.proyeccionPonderada || 0);
  const sellersToday = Number(data?.vendedoresActivosHoy || 0);
  const totalSellers = Number(data?.totalVendedores || 0);

  useEffect(() => {
    if (!dashboardQuery.data) return;
    const { clients: clientsData, opportunities: opportunitiesData, proposals: proposalsData, response, users } = dashboardQuery.data;
    const rows = buildSellerRows({ oportunidades: opportunitiesData, propuestas: proposalsData, users });
    const visibleRows = isSupervisorView ? rows.slice(0, 4) : rows.filter((row) => row.uid === backendUser?.uid).slice(0, 1);
    queueMicrotask(() => {
      setData(response);
      setClients(clientsData);
      setOpportunities(opportunitiesData);
      setProposals(proposalsData);
      setUsers(users);
      setSellerRows(visibleRows);
      setActivityAlerts([
        ...opportunitiesData
          .filter((item) => ["negociacion", "perdido"].includes(item.etapa))
          .slice(0, 3)
          .map((item) => ({
            type: item.etapa === "perdido" ? "critical" : "warning",
            title: item.etapa === "perdido" ? "Propuesta en Riesgo" : "Negociacion Extendida",
            body: `${item.titulo} - ${compactMoney(item.valorEstimado)}`,
          })),
        ...proposalsData
          .filter((item) => item.estado === "aceptada")
          .slice(0, 2)
          .map((item) => ({ type: "info", title: "Cierre Exitoso", body: `${item.titulo} por ${compactMoney(item.montoTotal)}` })),
      ]);
    });
  }, [backendUser?.uid, dashboardQuery.data, isSupervisorView]);

  const effectiveForecastSellerUid = isSupervisorView ? forecastSellerUid : backendUser?.uid || "";
  const forecastPoints = useMemo(() => buildForecastSeries({
    granularity: forecastMode,
    opportunities,
    proposals,
    sellerUid: effectiveForecastSellerUid,
  }), [effectiveForecastSellerUid, forecastMode, opportunities, proposals]);
  const forecastTarget = useMemo(() => calculateForecastTarget({
    opportunities,
    proposals,
    sellerUid: effectiveForecastSellerUid,
  }), [effectiveForecastSellerUid, opportunities, proposals]);
  const forecastSellerOptions = useMemo(
    () => buildSellerRows({ oportunidades: opportunities, propuestas: proposals, users }),
    [opportunities, proposals, users],
  );
  const selectedForecastSeller = forecastSellerOptions.find((seller) => seller.uid === effectiveForecastSellerUid);
  const forecastSellerLabel = isSupervisorView
    ? selectedForecastSeller?.name || "equipo completo"
    : backendUser?.nombre || backendUser?.email || "vendedor actual";
  const forecastPeriod = forecastPoints.length
    ? `${forecastPoints[0].periodo}_a_${forecastPoints.at(-1).periodo}`
    : "sin-periodo";

  async function handleForecastDownload(format) {
    setForecastExporting(true);
    setForecastExportMessage("");

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      const generatedAt = new Date();
      const simple = format === "simple";
      const filename = buildForecastFilename({
        generatedAt,
        granularity: forecastMode,
        period: forecastPeriod,
        seller: forecastSellerLabel,
        simple,
      });

      if (simple) {
        downloadCsv(serializeSimpleForecastCsv(forecastPoints), filename);
      } else {
        const rows = enrichForecastSeries(forecastPoints, forecastTarget);
        const metadata = buildForecastMetadata({
          generatedAt,
          granularity: forecastMode,
          period: forecastPeriod,
          role: rol,
          seller: forecastSellerLabel,
          user: backendUser?.nombre || backendUser?.email,
          zone: selectedForecastSeller?.zone || backendUser?.zona,
        });
        downloadCsv(serializeAnalyticalForecastCsv({
          metadata,
          rows,
          summary: summarizeForecast(rows, forecastTarget),
        }), filename);
      }

      setForecastExportMessage(`Descarga ${simple ? "simple" : "analítica"} generada correctamente.`);
      setForecastExportOpen(false);
    } catch (exportError) {
      console.error("No se pudo exportar el forecast:", exportError);
      setForecastExportMessage("No se pudo generar la descarga. Intenta nuevamente.");
    } finally {
      setForecastExporting(false);
    }
  }
  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const visibleFunnelOpportunities = selectedFunnelZone
    ? opportunities.filter((item) => normalizeCompanyZone(clientsById.get(item.clienteId)?.region) === selectedFunnelZone)
    : opportunities;
  const visibleFunnelStages = buildFunnelStages(visibleFunnelOpportunities);

  return (
    <main className="page command-dashboard">
      {error && <p className="error-text">{error}</p>}
      {loading && <LoadingState />}

      {!loading && <section className={`command-kpi-grid ${!isSupervisorView ? "seller-kpi-grid" : ""}`}>
        <KpiCard
          icon="money"
          label="Proyeccion Ponderada (Mes)"
          metaLeft={`${formatCompactMoney(weightedForecast)} ponderado`}
          metaRight={`${formatCompactMoney(pipelineValue)} pipeline`}
          progress={pipelineValue > 0 ? Math.min((weightedForecast / pipelineValue) * 100, 100) : 0}
          value={formatCompactMoney(weightedForecast)}
        />
        <KpiCard
          accent="success"
          icon="conversion"
          label="Tasa de Conversion Global"
          metaLeft={`${getCount(data?.propuestasPorEstado, "aceptada")} cierres / ${data?.totalPropuestas ?? 0} propuestas`}
          metaRight="Prom. industria: 35%"
          progress={conversionRate}
          value={`${conversionRate}%`}
        />
        <KpiCard
          accent="warning"
          icon="ticket"
          label="Ticket Promedio"
          metaLeft="Propuestas aceptadas"
          metaRight=""
          progress={acceptedValue > 0 ? Math.min((averageTicket / acceptedValue) * 100, 100) : 0}
          value={formatCompactMoney(averageTicket)}
        />
        {isSupervisorView && (
          <KpiCard
            accent="danger"
            icon="location"
            label="Vendedores Activos Hoy"
            metaLeft={`${Math.max(totalSellers - sellersToday, 0)} sin registros comerciales`}
            metaRight="Fuente: CRM"
            progress={totalSellers > 0 ? (sellersToday / totalSellers) * 100 : 0}
            value={`${sellersToday}/${totalSellers}`}
          />
        )}
      </section>}

      {!loading && <section className="command-main-grid">
        <ForecastChart
          canFilterSeller={isSupervisorView}
          exportMessage={forecastExportMessage}
          exportOpen={forecastExportOpen}
          exporting={forecastExporting}
          forecast={forecastPoints}
          mode={forecastMode}
          onDownload={handleForecastDownload}
          onExportToggle={() => setForecastExportOpen((open) => !open)}
          onModeChange={setForecastMode}
          onSellerChange={(sellerUid) => {
            setForecastSellerUid(sellerUid);
            setForecastExportMessage("");
          }}
          selectedSeller={forecastSellerUid}
          sellerOptions={forecastSellerOptions}
          targetValue={forecastTarget}
        />
        <SalesFunnel
          onStageSelect={setSelectedFunnelStage}
          onZoneChange={setSelectedFunnelZone}
          selectedZone={selectedFunnelZone}
          stages={visibleFunnelStages}
        />
      </section>}

      {!loading && <section className="dashboard-bottom-grid">
        <article className="card command-card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon"><PanelSvgIcon name="team" /></span>{isSupervisorView ? "Rendimiento del Equipo" : "Mi rendimiento"}</div>
            {isSupervisorView && <Link className="panel-filter" to="/equipo">Ver Todos</Link>}
          </div>
          <table className="team-table">
            <thead><tr><th>Vendedor</th><th>Estado</th><th>Win Rate</th><th>Pipeline</th></tr></thead>
            <tbody>
              {sellerRows.map((row) => (
                <tr key={row.uid}>
                  <td><div className="seller-cell"><span className="seller-avatar">{row.name.slice(0, 2).toUpperCase()}</span><div><strong>{row.name}</strong><small>{row.email}</small></div></div></td>
                  <td><span className={`status-badge ${row.active ? "online" : "offline"}`}>{row.active ? "Online" : "Offline"}</span></td>
                  <td><div className="win-rate"><span className="win-rate-bar"><i style={{ width: `${row.winRate}%` }} /></span>{row.winRate}%</div></td>
                  <td><strong>{compactMoney(row.pipeline)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="card command-card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon"><PanelSvgIcon name="alert" /></span>Alertas y Actividad</div>
            <span className="breadcrumb">{activityAlerts.length} sin leer</span>
          </div>
          <div className="activity-tabs" role="tablist" aria-label="Vista de alertas y actividad">
            <button className="active" type="button" role="tab" aria-selected="true">Alertas</button>
            <button type="button" role="tab" aria-selected="false" onClick={() => setShowMapUnavailable(true)}>Mapa</button>
          </div>
          <div className="alerts-list">
            {activityAlerts.map((alert, index) => (
              <div className={`alert-item ${alert.type}`} key={`${alert.title}-${index}`}>
                <span className="alert-icon"><AlertGlyph type={alert.type} /></span>
                <div><strong>{alert.title}</strong><p>{alert.body}</p></div>
                <small>CRM</small>
              </div>
            ))}
            {!loading && activityAlerts.length === 0 && <section className="empty-state"><h2>Sin alertas</h2><p>Las alertas apareceran con cierres, riesgos o negociaciones.</p></section>}
          </div>
        </article>
      </section>}

      {showMapUnavailable && <NotOperationalModal onClose={() => setShowMapUnavailable(false)} />}
      {selectedFunnelStage && (
        <FunnelStageDetailModal
          clientsById={clientsById}
          onClose={() => setSelectedFunnelStage(null)}
          opportunities={visibleFunnelOpportunities}
          stage={selectedFunnelStage}
        />
      )}
    </main>
  );
}

export default Dashboard;
