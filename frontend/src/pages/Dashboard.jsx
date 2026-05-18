import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { isSupervisorRole } from "../auth/roles";
import { getDashboardVendedor, getDashboardSupervisor } from "../services/api";

function getCount(items = [], key) {
  return items.find((item) => item.clave === key)?.total ?? 0;
}

function MetricList({ emptyText, items = [] }) {
  if (items.length === 0) {
    return <p className="muted-text">{emptyText}</p>;
  }

  return items.map((item) => (
    <p key={item.clave}>
      <span>{item.clave}</span>
      <strong>{item.total}</strong>
    </p>
  ));
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

function KpiCard({ accent = "violet", helper, icon, label, metaLeft, metaRight, progress = 60, trend, value }) {
  return (
    <article className={`command-kpi ${accent}`}>
      <div className="command-kpi-header">
        <span className="command-kpi-icon">{icon}</span>
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

function ForecastChart({ forecast = [], pipelineValue = 0, acceptedValue = 0 }) {
  const points = forecast.length > 0
    ? forecast
    : Array.from({ length: 5 }, (_, index) => ({
      etiqueta: `Sem ${index + 1}`,
      proyeccionPonderada: 0,
      ventaReal: 0,
    }));
  const maxValue = Math.max(
    pipelineValue,
    acceptedValue,
    ...points.flatMap((point) => [point.proyeccionPonderada, point.ventaReal]),
    1,
  );
  const target = formatCompactMoney(Math.max(pipelineValue, acceptedValue));
  const axisValues = [1, 0.75, 0.5, 0.25, 0].map((factor) => formatCompactMoney(maxValue * factor));

  return (
    <article className="command-panel forecast-panel">
      <div className="command-panel-header">
        <div className="panel-title">
          <span className="panel-icon violet">PY</span>
          <h2>Forecast vs Real (Ponderado)</h2>
        </div>
        <div className="panel-actions">
          <button type="button">Semanal</button>
          <button className="active" type="button">Mensual</button>
          <button type="button">DL</button>
        </div>
      </div>

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

function SalesFunnel({ stages = [] }) {
  const colors = ["blue", "violet", "warning", "orange", "success"];
  const fallbackStages = ["Prospeccion", "Calificacion", "Propuesta Enviada", "En Negociacion", "Cierre"]
    .map((name, index) => ({
      nombre: name,
      total: 0,
      conversionPct: index === 0 ? 100 : 0,
      fugaPct: 0,
      valorEstimado: 0,
    }));
  const visibleStages = stages.length > 0 ? stages : fallbackStages;

  return (
    <article className="command-panel funnel-panel">
      <div className="command-panel-header">
        <div className="panel-title">
          <span className="panel-icon violet">FN</span>
          <h2>Embudo de Ventas</h2>
        </div>
        <button className="panel-filter" type="button">Toda la Empresa</button>
      </div>

      <div className="funnel-list">
        {visibleStages.map((stage, index) => (
          <div className={`funnel-stage ${colors[index] || "blue"}`} key={stage.clave || stage.nombre}>
            <span className="funnel-icon">{stage.nombre.slice(0, 2).toUpperCase()}</span>
            <div className="funnel-info">
              <strong>{stage.nombre}</strong>
              <div className="funnel-bar">
                <span style={{ width: `${Math.min(stage.conversionPct || 0, 100)}%` }} />
              </div>
            </div>
            <div className="funnel-metric">
              <strong>{stage.total}</strong>
              <small>
                {index === 0
                  ? "Leads nuevos"
                  : stage.clave === "ganado"
                    ? formatCompactMoney(stage.valorEstimado)
                    : `-${Number(stage.fugaPct || 0).toLocaleString("es-CL")}% fuga`}
              </small>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function Dashboard() {
  const { idToken, backendUser } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const rol = backendUser?.rol || "vendedor";
  const isSupervisorView = isSupervisorRole(rol);
  const pipelineValue = Number(data?.valorPipeline || 0);
  const acceptedValue = Number(data?.valorPropuestasAceptadas || 0);
  const conversionRate = Number(data?.tasaConversionGlobal || 0);
  const averageTicket = Number(data?.ticketPromedio || 0);
  const weightedForecast = Number(data?.proyeccionPonderada || 0);
  const sellersToday = Number(data?.vendedoresActivosHoy || 0);
  const totalSellers = Number(data?.totalVendedores || 0);

  useEffect(() => {
    async function cargarDashboard() {
      if (!idToken) return;

      try {
        setLoading(true);
        const response = isSupervisorView
          ? await getDashboardSupervisor(idToken)
          : await getDashboardVendedor(idToken);

        setData(response);
      } catch (loadError) {
        console.error("Error dashboard:", loadError);
        setError("No se pudo cargar el dashboard");
      } finally {
        setLoading(false);
      }
    }

    cargarDashboard();
  }, [idToken, isSupervisorView]);

  return (
    <main className="page command-dashboard">
      {loading && <p className="status-message">Cargando metricas...</p>}
      {error && <p className="error-text">{error}</p>}

      <section className="command-kpi-grid">
        <KpiCard
          icon="$"
          label="Proyeccion Ponderada (Mes)"
          metaLeft={`${formatCompactMoney(weightedForecast)} ponderado`}
          metaRight={`${formatCompactMoney(pipelineValue)} pipeline`}
          progress={pipelineValue > 0 ? Math.min((weightedForecast / pipelineValue) * 100, 100) : 0}
          value={formatCompactMoney(weightedForecast)}
        />
        <KpiCard
          accent="success"
          icon="OK"
          label="Tasa de Conversion Global"
          metaLeft={`${getCount(data?.propuestasPorEstado, "aceptada")} cierres / ${data?.totalPropuestas ?? 0} propuestas`}
          metaRight="Prom. industria: 35%"
          progress={conversionRate}
          value={`${conversionRate}%`}
        />
        <KpiCard
          accent="warning"
          icon="TK"
          label="Ticket Promedio"
          metaLeft="Propuestas aceptadas"
          metaRight=""
          progress={acceptedValue > 0 ? Math.min((averageTicket / acceptedValue) * 100, 100) : 0}
          value={formatCompactMoney(averageTicket)}
        />
        <KpiCard
          accent="danger"
          icon="VG"
          label="Vendedores Activos Hoy"
          metaLeft={`${Math.max(totalSellers - sellersToday, 0)} sin registros comerciales`}
          metaRight="Fuente: CRM"
          progress={totalSellers > 0 ? (sellersToday / totalSellers) * 100 : 0}
          value={`${sellersToday}/${totalSellers}`}
        />
      </section>

      <section className="command-main-grid">
        <ForecastChart
          acceptedValue={acceptedValue}
          forecast={data?.forecastMensual}
          pipelineValue={pipelineValue}
        />
        <SalesFunnel stages={data?.embudoVentas} />
      </section>

      {isSupervisorView && (
        <section className="dashboard-detail">
          <article>
            <h2>Clientes por rubro</h2>
            <MetricList items={data?.clientesPorRubro} emptyText="Sin clientes por rubro." />
          </article>

          <article>
            <h2>Clientes por region</h2>
            <MetricList items={data?.clientesPorRegion} emptyText="Sin clientes por region." />
          </article>

          <article>
            <h2>Oportunidades por etapa</h2>
            <MetricList items={data?.oportunidadesPorEtapa} emptyText="Sin oportunidades por etapa." />
          </article>

          <article>
            <h2>Propuestas por estado</h2>
            <MetricList items={data?.propuestasPorEstado} emptyText="Sin propuestas por estado." />
          </article>
        </section>
      )}

      <section className="quick-section command-quick-section">
        <h2>Acciones rapidas</h2>

        <div className="quick-grid">
          <Link to="/clientes" className="quick-card">
            <span>CL</span>
            <strong>Clientes</strong>
          </Link>

          <Link to="/crear" className="quick-card">
            <span>+</span>
            <strong>Nuevo Cliente</strong>
          </Link>

          <Link to="/interacciones" className="quick-card">
            <span>IN</span>
            <strong>Interacciones</strong>
          </Link>

          <Link to="/oportunidades" className="quick-card">
            <span>OP</span>
            <strong>Oportunidades</strong>
          </Link>

          <Link to="/propuestas" className="quick-card">
            <span>PR</span>
            <strong>Propuestas</strong>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
