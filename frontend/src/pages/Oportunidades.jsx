import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
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

function Oportunidades() {
  const { idToken } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!idToken) return;
      try {
        const [clientesData, oportunidadesData] = await Promise.all([
          getClientes(idToken),
          getOportunidades(idToken, { etapa: filtroEtapa }),
        ]);
        setClientes(clientesData);
        setOportunidades(oportunidadesData);
      } catch (loadError) {
        setError(getFriendlyApiError(loadError));
      }
    }

    loadData();
  }, [idToken, filtroEtapa]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
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
          <select name="clienteId" value={form.clienteId} onChange={handleChange} required>
            <option value="">Selecciona cliente</option>
            {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.empresa}</option>)}
          </select>
        </label>
        <label>Titulo
          <input name="titulo" maxLength={160} value={form.titulo} onChange={handleChange} required />
        </label>
        <label>Valor estimado
          <input name="valorEstimado" type="number" min="0" value={form.valorEstimado} onChange={handleChange} />
        </label>
        <label>Probabilidad
          <input name="probabilidad" type="number" min="0" max="100" value={form.probabilidad} onChange={handleChange} />
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
