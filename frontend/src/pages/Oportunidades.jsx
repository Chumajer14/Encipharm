import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import ClienteSelect from "../components/ClienteSelect";
import { createOportunidad, getClientes, getOportunidades, updateOportunidad } from "../services/api";
import { getFriendlyApiError } from "../utils/apiErrors";

const etapas = ["nuevo", "contactado", "cotizacion", "negociacion", "ganado", "perdido"];
const initialForm = {
  clienteId: "",
  titulo: "",
  etapa: "nuevo",
  valorEstimado: "",
  probabilidad: 0,
  descripcion: "",
};

function formatAmount(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("es-CL") : "";
}

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`;
}

function weightedValue(item) {
  return Number(item.valorEstimado || 0) * (Number(item.probabilidad || 0) / 100);
}

function buildFunnel(oportunidades) {
  const labels = {
    nuevo: "Prospeccion",
    contactado: "Calificacion",
    cotizacion: "Propuesta enviada",
    negociacion: "En negociacion",
    ganado: "Cierre",
    perdido: "Perdido",
  };
  const total = Math.max(oportunidades.length, 1);

  return etapas.map((etapa) => {
    const items = oportunidades.filter((item) => item.etapa === etapa);
    const value = items.reduce((sum, item) => sum + Number(item.valorEstimado || 0), 0);
    return {
      etapa,
      label: labels[etapa],
      count: items.length,
      percent: Math.round((items.length / total) * 100),
      value,
    };
  });
}

function Oportunidades() {
  const { idToken } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [loadingClientes, setLoadingClientes] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!idToken) return;
      try {
        setLoadingClientes(true);
        const [clientesData, oportunidadesData] = await Promise.all([
          getClientes(idToken),
          getOportunidades(idToken, { etapa: filtroEtapa }),
        ]);
        setClientes(clientesData);
        setOportunidades(oportunidadesData);
      } catch (loadError) {
        setError(getFriendlyApiError(loadError));
      } finally {
        setLoadingClientes(false);
      }
    }

    loadData();
  }, [idToken, filtroEtapa]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "valorEstimado") {
      setForm({ ...form, valorEstimado: value.replace(/\D/g, "") });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      setSaving(true);
      const created = await createOportunidad(idToken, {
        ...form,
        valorEstimado: Number(form.valorEstimado || 0),
        probabilidad: Number(form.probabilidad || 0),
        descripcion: form.descripcion || null,
      });
      setOportunidades([created, ...oportunidades]);
      setForm(initialForm);
      if (filtroEtapa && created.etapa !== filtroEtapa) {
        setFiltroEtapa("");
      }
    } catch (saveError) {
      setError(getFriendlyApiError(saveError));
    } finally {
      setSaving(false);
    }
  };

  const moveStage = async (oportunidad, etapa) => {
    setError("");
    try {
      setUpdatingId(oportunidad.id);
      const updated = await updateOportunidad(idToken, oportunidad.id, { etapa });
      setOportunidades(
        oportunidades
          .map((item) => item.id === updated.id ? updated : item)
          .filter((item) => !filtroEtapa || item.etapa === filtroEtapa)
      );
    } catch (updateError) {
      setError(getFriendlyApiError(updateError));
    } finally {
      setUpdatingId("");
    }
  };

  const clientesById = new Map(clientes.map((cliente) => [cliente.id, cliente]));
  const funnel = buildFunnel(oportunidades);
  const totalPipeline = oportunidades.reduce((sum, item) => sum + Number(item.valorEstimado || 0), 0);
  const totalPonderado = oportunidades.reduce((sum, item) => sum + weightedValue(item), 0);

  return (
    <main className="page pipeline-content">
      <section className="pipeline-header-bar">
        <div>
          <h2>Pipeline & Funnels</h2>
          <p className="sub">Gestion detallada de oportunidades y proyeccion ponderada con datos reales</p>
        </div>
        <Link to="/dashboard"><button className="btn-secondary" type="button">Volver</button></Link>
      </section>

      {error && <section className="notice notice-error"><strong>Error</strong><span>{error}</span></section>}

      <section className="filters-card pipeline-filter-bar">
        <label>Etapa
          <select className="filter-select" value={filtroEtapa} onChange={(event) => setFiltroEtapa(event.target.value)}>
            <option value="">Todas las etapas</option>
            {etapas.map((etapa) => <option key={etapa} value={etapa}>{etapa}</option>)}
          </select>
        </label>
      </section>

      <section className="pipeline-grid">
        <aside className="funnel-summary-card">
          <h3>Resumen del Funnel</h3>
          <div className="funnel-summary-stages">
            {funnel.map((stage) => (
              <div className={`funnel-summary-stage ${stage.etapa}`} key={stage.etapa}>
                <div className="fs-bar" style={{ width: `${Math.max(stage.percent, 4)}%` }} />
                <span className="fs-label">{stage.label}</span>
                <span className="fs-count">{stage.count}</span>
              </div>
            ))}
          </div>
          <div className="funnel-summary-totals">
            <p className="tot-label">Valor pipeline</p>
            <strong className="tot-value">{money(totalPipeline)}</strong>
            <p className="tot-label">Proyeccion ponderada</p>
            <strong className="tot-value green">{money(totalPonderado)}</strong>
            <p className="tot-note">Calculado con valor estimado x probabilidad por oportunidad.</p>
          </div>
        </aside>

        <section className="pipeline-table-wrap">
          <table className="pipeline-table">
            <thead>
              <tr>
                <th>Oportunidad</th>
                <th>Cliente</th>
                <th>Etapa</th>
                <th className="text-right">Valor</th>
                <th className="text-right">Prob.</th>
                <th className="text-right">Ponderado</th>
              </tr>
            </thead>
            <tbody>
              {oportunidades.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/oportunidades/${item.id}`} className="pipeline-link">{item.titulo}</Link>
                  </td>
                  <td>{clientesById.get(item.clienteId)?.empresa || item.clienteId}</td>
                  <td>
                    <select
                      value={item.etapa}
                      disabled={updatingId === item.id}
                      onChange={(event) => moveStage(item, event.target.value)}
                    >
                      {etapas.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                    </select>
                  </td>
                  <td className="td-right">{money(item.valorEstimado)}</td>
                  <td className="td-right">{item.probabilidad}%</td>
                  <td className="td-right">{money(weightedValue(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loadingClientes && oportunidades.length === 0 && (
            <section className="empty-state">
              <h2>Sin oportunidades para mostrar</h2>
              <p>Crea una oportunidad o cambia el filtro de etapa.</p>
            </section>
          )}
        </section>
      </section>

      <form className="form form-card pipeline-create-card" onSubmit={handleSubmit}>
        <h2>Nueva oportunidad</h2>
        <label>Cliente
          <ClienteSelect
            clientes={clientes}
            loading={loadingClientes}
            onChange={handleChange}
            value={form.clienteId}
          />
        </label>
        <label>Titulo
          <input name="titulo" maxLength={160} value={form.titulo} onChange={handleChange} required />
        </label>
        <label>Valor estimado
          <div className="currency-input">
            <span>$</span>
            <input
              name="valorEstimado"
              inputMode="numeric"
              value={formatAmount(form.valorEstimado)}
              onChange={handleChange}
            />
          </div>
        </label>
        <label>Probabilidad
          <div className="suffix-input">
            <input name="probabilidad" type="number" min="0" max="100" value={form.probabilidad} onChange={handleChange} />
            <span>%</span>
          </div>
        </label>
        <label>Descripcion
          <textarea name="descripcion" maxLength={1000} value={form.descripcion} onChange={handleChange} />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={saving}>{saving ? "Creando..." : "Crear oportunidad"}</button>
        </div>
      </form>
    </main>
  );
}

export default Oportunidades;
