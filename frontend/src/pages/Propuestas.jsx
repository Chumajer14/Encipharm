import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { createPropuesta, getClientes, getOportunidades, getPropuestas, updatePropuesta } from "../services/api";
import { getFriendlyApiError } from "../utils/apiErrors";

const initialForm = {
  clienteId: "",
  oportunidadId: "",
  titulo: "",
  montoNeto: "",
  descuentoPct: 0,
  estado: "borrador",
  notas: "",
};

const estados = ["borrador", "enviada", "aceptada", "rechazada"];

function Propuestas() {
  const { idToken } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [propuestas, setPropuestas] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!idToken) return;
      try {
        const [clientesData, oportunidadesData, propuestasData] = await Promise.all([
          getClientes(idToken),
          getOportunidades(idToken),
          getPropuestas(idToken, { estado: filtroEstado }),
        ]);
        setClientes(clientesData);
        setOportunidades(oportunidadesData);
        setPropuestas(propuestasData);
      } catch (loadError) {
        setError(getFriendlyApiError(loadError));
      }
    }

    loadData();
  }, [idToken, filtroEstado]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "clienteId") {
      setForm({ ...form, clienteId: value, oportunidadId: "" });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      setSaving(true);
      const created = await createPropuesta(idToken, {
        ...form,
        montoNeto: Number(form.montoNeto || 0),
        descuentoPct: Number(form.descuentoPct || 0),
        notas: form.notas || null,
      });
      setPropuestas([created, ...propuestas]);
      setForm(initialForm);
      if (filtroEstado && created.estado !== filtroEstado) {
        setFiltroEstado("");
      }
    } catch (saveError) {
      setError(getFriendlyApiError(saveError));
    } finally {
      setSaving(false);
    }
  };

  const updateEstado = async (propuesta, estado) => {
    setError("");
    try {
      setUpdatingId(propuesta.id);
      const updated = await updatePropuesta(idToken, propuesta.id, { estado });
      setPropuestas(
        propuestas
          .map((item) => item.id === updated.id ? updated : item)
          .filter((item) => !filtroEstado || item.estado === filtroEstado)
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
          <h1>Propuestas</h1>
          <p>Estados y calculos basicos para cotizaciones comerciales</p>
        </div>
        <Link to="/dashboard"><button className="btn-secondary" type="button">Volver</button></Link>
      </section>

      {error && <section className="notice notice-error"><strong>Error</strong><span>{error}</span></section>}

      <section className="filters-card compact-filters">
        <label>Estado
          <select className="filter-select" value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value)}>
            <option value="">Todos los estados</option>
            {estados.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
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
        <label>Oportunidad
          <select name="oportunidadId" value={form.oportunidadId} onChange={handleChange} required>
            <option value="">Selecciona oportunidad</option>
            {oportunidades
              .filter((item) => !form.clienteId || item.clienteId === form.clienteId)
              .map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}
          </select>
        </label>
        <label>Titulo
          <input name="titulo" maxLength={160} value={form.titulo} onChange={handleChange} required />
        </label>
        <label>Monto neto
          <input name="montoNeto" type="number" min="0" value={form.montoNeto} onChange={handleChange} required />
        </label>
        <label>Descuento %
          <input name="descuentoPct" type="number" min="0" max="100" value={form.descuentoPct} onChange={handleChange} />
        </label>
        <label>Notas
          <textarea name="notas" maxLength={1000} value={form.notas} onChange={handleChange} />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={saving}>{saving ? "Creando..." : "Crear propuesta"}</button>
        </div>
      </form>

      <section className="list spaced-list">
        {propuestas.map((propuesta) => (
          <article className="client-card" key={propuesta.id}>
            <div>
              <h3>{propuesta.titulo}</h3>
              <p>Total: ${Number(propuesta.montoTotal || 0).toLocaleString()} / descuento ${Number(propuesta.montoDescuento || 0).toLocaleString()}</p>
              <span>{propuesta.estado}</span>
            </div>
            <div className="client-actions">
              <select value={propuesta.estado} disabled={updatingId === propuesta.id} onChange={(event) => updateEstado(propuesta, event.target.value)}>
                {estados.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
              </select>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Propuestas;
