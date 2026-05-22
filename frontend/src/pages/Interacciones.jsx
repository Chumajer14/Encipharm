import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import ClienteSelect from "../components/ClienteSelect";
import LoadingState from "../components/LoadingState";
import useCachedQuery, { invalidateCachedQuery } from "../hooks/useCachedQuery";
import { createInteraccion, getClientes, getInteracciones } from "../services/api";
import { getFriendlyApiError } from "../utils/apiErrors";

const initialForm = {
  clienteId: "",
  tipo: "visita",
  fecha: "",
  hora: "",
  resumen: "",
  resultado: "",
  proximaAccion: "",
};

function Interacciones() {
  const { idToken } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [interacciones, setInteracciones] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const interaccionesQuery = useCachedQuery(
    "interacciones:dataset",
    async () => {
      const [clientesData, interaccionesData] = await Promise.all([
        getClientes(idToken),
        getInteracciones(idToken),
      ]);
      return { clientes: clientesData, interacciones: interaccionesData };
    },
    { enabled: Boolean(idToken), initialData: null },
  );
  const loadingClientes = interaccionesQuery.loading;

  useEffect(() => {
    if (!interaccionesQuery.data) return;
    queueMicrotask(() => {
      setClientes(interaccionesQuery.data.clientes);
      setInteracciones(interaccionesQuery.data.interacciones);
    });
  }, [interaccionesQuery.data]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      setSaving(true);
      const payload = {
        ...form,
        fecha: new Date(`${form.fecha}T${form.hora}`).toISOString(),
        hora: undefined,
        resultado: form.resultado || null,
        proximaAccion: form.proximaAccion || null,
      };
      const created = await createInteraccion(idToken, payload);
      setInteracciones([created, ...interacciones]);
      invalidateCachedQuery("interacciones:");
      invalidateCachedQuery("inteligencia:");
      setForm(initialForm);
      setSuccess("Interaccion registrada correctamente.");
    } catch (saveError) {
      setError(getFriendlyApiError(saveError));
    } finally {
      setSaving(false);
    }
  };

  const clienteNombre = (clienteId) => (
    clientes.find((cliente) => cliente.id === clienteId)?.empresa || clienteId
  );

  return (
    <main className="page">
      <section className="header header-row">
        <div>
          <h1>Interacciones</h1>
          <p>Registro de llamadas, visitas, correos y reuniones comerciales</p>
        </div>
        <Link to="/dashboard"><button className="btn-secondary" type="button">Volver</button></Link>
      </section>

      {error && <section className="notice notice-error"><strong>Error</strong><span>{error}</span></section>}
      {success && <section className="notice notice-success"><strong>OK</strong><span>{success}</span></section>}

      <form className="form form-card" onSubmit={handleSubmit}>
        <label>Cliente
          <ClienteSelect
            clientes={clientes}
            loading={loadingClientes}
            onChange={handleChange}
            value={form.clienteId}
          />
        </label>
        <label>Tipo
          <select name="tipo" value={form.tipo} onChange={handleChange}>
            <option value="visita">Visita</option>
            <option value="llamada">Llamada</option>
            <option value="correo">Correo</option>
            <option value="reunion">Reunion</option>
          </select>
        </label>
        <div className="date-time-grid">
          <label>Fecha
            <input name="fecha" type="date" value={form.fecha} onChange={handleChange} required />
          </label>
          <label>Hora
            <input name="hora" type="time" value={form.hora} onChange={handleChange} required />
          </label>
        </div>
        <label>Resumen
          <textarea name="resumen" maxLength={1000} value={form.resumen} onChange={handleChange} required />
        </label>
        <label>Resultado
          <input name="resultado" maxLength={500} value={form.resultado} onChange={handleChange} />
        </label>
        <label>Proxima accion
          <input name="proximaAccion" maxLength={500} value={form.proximaAccion} onChange={handleChange} />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={saving}>{saving ? "Guardando..." : "Registrar interaccion"}</button>
        </div>
      </form>

      {loadingClientes && <LoadingState />}

      {!loadingClientes && <section className="list spaced-list">
        {interacciones.map((item) => (
          <article className="client-card" key={item.id}>
            <div>
              <h3>{clienteNombre(item.clienteId)}</h3>
              <p>{item.tipo} / {new Date(item.fecha).toLocaleString()}</p>
              <span>{item.resumen}</span>
            </div>
          </article>
        ))}
      </section>}
    </main>
  );
}

export default Interacciones;
