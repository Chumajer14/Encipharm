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

  return (
    <main className="page">
      <section className="header header-row">
        <div>
          <h1>Oportunidades</h1>
          <p>Pipeline comercial minimo por etapa</p>
        </div>
        <Link to="/dashboard"><button className="btn-secondary" type="button">Volver</button></Link>
      </section>

      {error && <section className="notice notice-error"><strong>Error</strong><span>{error}</span></section>}

      <section className="filters-card compact-filters">
        <label>Etapa
          <select className="filter-select" value={filtroEtapa} onChange={(event) => setFiltroEtapa(event.target.value)}>
            <option value="">Todas las etapas</option>
            {etapas.map((etapa) => <option key={etapa} value={etapa}>{etapa}</option>)}
          </select>
        </label>
      </section>

      <form className="form form-card" onSubmit={handleSubmit}>
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

      <section className="kanban-board">
        {etapas.map((etapa) => (
          <article className="kanban-column" key={etapa}>
            <h2>{etapa}</h2>
            {oportunidades.filter((item) => item.etapa === etapa).map((item) => (
              <div className="kanban-item" key={item.id}>
                <strong>{item.titulo}</strong>
                <span>${Number(item.valorEstimado || 0).toLocaleString()} / {item.probabilidad}%</span>
                <select value={item.etapa} disabled={updatingId === item.id} onChange={(event) => moveStage(item, event.target.value)}>
                  {etapas.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                </select>
                <Link to={`/oportunidades/${item.id}`}>Ver detalle</Link>
              </div>
            ))}
          </article>
        ))}
      </section>
    </main>
  );
}

export default Oportunidades;
