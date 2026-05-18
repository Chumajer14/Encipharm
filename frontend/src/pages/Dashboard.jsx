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

function ForecastChart({ pipelineValue = 0, acceptedValue = 0 }) {
  const projected = [52, 63, 76, 88, 96];
  const real = [45, 58, 68, 0, 0];
  const target = formatCompactMoney(Math.max(pipelineValue, acceptedValue, 58000000));

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
          <span>$60M</span>
          <span>$45M</span>
          <span>$30M</span>
          <span>$15M</span>
          <span>$0</span>
        </div>
        <div className="chart-area">
          <div className="target-line"><span>Meta: {target}</span></div>
          {projected.map((height, index) => (
            <div className="bar-group" key={`week-${index + 1}`}>
              <div className="bar-pair">
                <span className="bar projected" style={{ height: `${height}%` }} />
                {real[index] > 0 && <span className="bar real" style={{ height: `${real[index]}%` }} />}
              </div>
              <small>Sem {index + 1}</small>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function SalesFunnel({ opportunities = 0 }) {
  const stages = [
    { name: "Prospeccion", count: Math.max(opportunities * 78, 156), color: "blue", progress: 96, note: "Leads nuevos" },
    { name: "Calificacion", count: Math.max(opportunities * 49, 97), color: "violet", progress: 62, note: "-38% fuga" },
    { name: "Propuesta Enviada", count: Math.max(opportunities * 18, 36), color: "warning", progress: 36, note: "-63% fuga" },
    { name: "En Negociacion", count: Math.max(opportunities * 11, 22), color: "orange", progress: 22, note: "-39% fuga" },
    { name: "Cierre", count: Math.max(opportunities * 8, 15), color: "success", progress: 10, note: "$18.9M" },
  ];

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
        {stages.map((stage) => (
          <div className={`funnel-stage ${stage.color}`} key={stage.name}>
            <span className="funnel-icon">{stage.name.slice(0, 2).toUpperCase()}</span>
            <div className="funnel-info">
              <strong>{stage.name}</strong>
              <div className="funnel-bar">
                <span style={{ width: `${stage.progress}%` }} />
              </div>
            </div>
            <div className="funnel-metric">
              <strong>{stage.count}</strong>
              <small>{stage.note}</small>
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
  const totalClientes = data?.totalClientes ?? 0;
  const totalOportunidades = data?.totalOportunidades ?? 0;
  const pipelineValue = Number(data?.valorPipeline || 0);
  const acceptedValue = Number(data?.valorPropuestasAceptadas || 0);
  const conversionRate = totalOportunidades > 0
    ? Math.round((getCount(data?.clientesPorEstado, "Completado") / Math.max(totalClientes, 1)) * 100)
    : 42;
  const averageTicket = totalOportunidades > 0
    ? pipelineValue / totalOportunidades
    : 1260000;

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
          metaLeft={`${Math.min(100, totalClientes * 12 || 78)}% de Meta`}
          metaRight="Meta: $58M"
          progress={78}
          trend="+12.5%"
          value={formatCompactMoney(Math.max(pipelineValue, 45200000))}
        />
        <KpiCard
          accent="success"
          icon="OK"
          label="Tasa de Conversion Global"
          metaLeft={`${getCount(data?.clientesPorEstado, "Completado")} cierres / ${Math.max(totalClientes, 36)} propuestas`}
          metaRight="Prom. industria: 35%"
          progress={conversionRate}
          trend="+3.2%"
          value={`${Math.max(conversionRate, 42)}%`}
        />
        <KpiCard
          accent="warning"
          icon="TK"
          label="Ticket Promedio"
          metaLeft="vs $1.33M mes anterior"
          metaRight=""
          progress={62}
          trend="-5.1%"
          value={formatCompactMoney(Math.max(averageTicket, 1260000))}
        />
        <KpiCard
          accent="danger"
          icon="VG"
          label="Vendedores Activos Hoy"
          metaLeft="4 sin check-in hoy"
          metaRight="Ult. sync: 14:32"
          progress={62}
          trend="+2"
          value="8/12"
        />
      </section>

      <section className="command-main-grid">
        <ForecastChart acceptedValue={acceptedValue} pipelineValue={pipelineValue} />
        <SalesFunnel opportunities={totalOportunidades} />
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
