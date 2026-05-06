import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { createInteraccion, getClientes, getInteracciones } from "../services/api";
import { getFriendlyApiError } from "../utils/apiErrors";

const initialForm = {
  clienteId: "",
  tipo: "visita",
  fecha: "",
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

  useEffect(() => {
    async function loadData() {
      if (!idToken) return;
      try {
        const [clientesData, interaccionesData] = await Promise.all([
          getClientes(idToken),
          getInteracciones(idToken),
        ]);
        setClientes(clientesData);
        setInteracciones(interaccionesData);
      } catch (loadError) {
        setError(getFriendlyApiError(loadError));
      }
    }

    loadData();
  }, [idToken]);

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
        fecha: new Date(form.fecha).toISOString(),
        resultado: form.resultado || null,
        proximaAccion: form.proximaAccion || null,
      };
      const created = await createInteraccion(idToken, payload);
      setInteracciones([created, ...interacciones]);
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
          <select name="clienteId" value={form.clienteId} onChange={handleChange} required>
            <option value="">Selecciona cliente</option>
            {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.empresa}</option>)}
          </select>
        </label>
        <label>Tipo
          <select name="tipo" value={form.tipo} onChange={handleChange}>
            <option value="visita">Visita</option>
            <option value="llamada">Llamada</option>
            <option value="correo">Correo</option>
            <option value="reunion">Reunion</option>
          </select>
        </label>
        <label>Fecha
          <input name="fecha" type="datetime-local" value={form.fecha} onChange={handleChange} required />
        </label>
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

      <section className="list spaced-list">
        {interacciones.map((item) => (
          <article className="client-card" key={item.id}>
            <div>
              <h3>{clienteNombre(item.clienteId)}</h3>
              <p>{item.tipo} / {new Date(item.fecha).toLocaleString()}</p>
              <span>{item.resumen}</span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Interacciones;
