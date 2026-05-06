import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { regionesChile } from "../data/regionesChile";
import { deleteCliente, getCliente, updateCliente } from "../services/api";
import { getFriendlyApiError } from "../utils/apiErrors";
import {
  CLIENTE_ESTADOS,
  clienteInitialForm,
  validateClienteForm,
} from "../utils/clienteForm";

function ClienteDetalle() {
  const { clienteId } = useParams();
  const { idToken } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(clienteInitialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function cargarCliente() {
      if (!idToken || !clienteId) return;

      try {
        setLoading(true);
        const cliente = await getCliente(idToken, clienteId);
        setForm({
          nombre: cliente.nombre || "",
          empresa: cliente.empresa || "",
          email: cliente.email || "",
          telefono: cliente.telefono || "",
          rubro: cliente.rubro || "",
          region: cliente.region || "",
          estado: cliente.estado || "En proceso",
        });
      } catch (loadError) {
        setError(getFriendlyApiError(loadError));
      } finally {
        setLoading(false);
      }
    }

    cargarCliente();
  }, [clienteId, idToken]);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validation = validateClienteForm(form);
    setFieldErrors(validation.errors);
    if (!validation.isValid) {
      setError("Corrige los campos marcados antes de guardar.");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateCliente(idToken, clienteId, validation.payload);
      setSuccess(`Cliente ${updated.empresa} actualizado correctamente.`);
    } catch (saveError) {
      setError(getFriendlyApiError(saveError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Eliminar este cliente del CRM?");
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteCliente(idToken, clienteId);
      navigate("/clientes", {
        replace: true,
        state: { notice: "Cliente eliminado correctamente." },
      });
    } catch (deleteError) {
      setError(getFriendlyApiError(deleteError));
      setDeleting(false);
    }
  };

  const disabled = loading || saving || deleting;

  return (
    <main className="page">
      <section className="header header-row">
        <div>
          <h1>Detalle de Cliente</h1>
          <p>Consulta y actualizacion de datos base del CRM</p>
        </div>

        <Link to="/clientes">
          <button className="btn-secondary" type="button">
            Volver
          </button>
        </Link>
      </section>

      {loading && <p className="status-message">Cargando cliente...</p>}
      {error && (
        <section className="notice notice-error" role="alert">
          <strong>Operacion no completada</strong>
          <span>{error}</span>
        </section>
      )}
      {success && (
        <section className="notice notice-success" role="status">
          <strong>Cliente actualizado</strong>
          <span>{success}</span>
        </section>
      )}

      <form className="form form-card" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input name="nombre" maxLength={120} value={form.nombre} onChange={handleChange} disabled={disabled} />
          {fieldErrors.nombre && <small className="field-error">{fieldErrors.nombre}</small>}
        </label>

        <label>
          Empresa
          <input name="empresa" maxLength={160} value={form.empresa} onChange={handleChange} disabled={disabled} />
          {fieldErrors.empresa && <small className="field-error">{fieldErrors.empresa}</small>}
        </label>

        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} disabled={disabled} />
          {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
        </label>

        <label>
          Telefono
          <input name="telefono" maxLength={32} value={form.telefono} onChange={handleChange} disabled={disabled} />
          {fieldErrors.telefono && <small className="field-error">{fieldErrors.telefono}</small>}
        </label>

        <label>
          Rubro
          <input name="rubro" maxLength={120} value={form.rubro} onChange={handleChange} disabled={disabled} />
          {fieldErrors.rubro && <small className="field-error">{fieldErrors.rubro}</small>}
        </label>

        <label>
          Region
          <select name="region" value={form.region} onChange={handleChange} disabled={disabled}>
            <option value="">Selecciona una region</option>
            {regionesChile.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          {fieldErrors.region && <small className="field-error">{fieldErrors.region}</small>}
        </label>

        <label>
          Estado
          <select name="estado" value={form.estado} onChange={handleChange} disabled={disabled}>
            {CLIENTE_ESTADOS.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </label>

        <div className="form-actions">
          <button className="btn-danger" type="button" onClick={handleDelete} disabled={disabled}>
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
          <button type="submit" disabled={disabled}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default ClienteDetalle;
