import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { regionesChile } from "../data/regionesChile";
import { createCliente } from "../services/api";
import { getFriendlyApiError } from "../utils/apiErrors";
import {
  CLIENTE_ESTADOS,
  clienteInitialForm,
  validateClienteForm,
} from "../utils/clienteForm";

function CrearCliente() {
  const [form, setForm] = useState(clienteInitialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { idToken } = useAuth();
  const navigate = useNavigate();

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
      const createdCliente = await createCliente(idToken, validation.payload);
      const successMessage = `Cliente ${createdCliente.empresa} creado exitosamente.`;

      setSuccess(successMessage);
      setForm(clienteInitialForm);

      window.setTimeout(() => {
        navigate("/clientes", {
          replace: true,
          state: { notice: successMessage },
        });
      }, 1200);
    } catch (saveError) {
      setError(getFriendlyApiError(saveError));
      setSaving(false);
    }
  };

  const formDisabled = saving || Boolean(success);

  return (
    <main className="page">
      <section className="header header-row">
        <div>
          <h1>Nuevo Cliente</h1>
          <p>Registro real en Firestore para el MVP comercial</p>
        </div>

        <Link to="/clientes">
          <button className="btn-secondary" type="button">
            Volver
          </button>
        </Link>
      </section>

      {error && (
        <section className="notice notice-error" role="alert">
          <strong>No se pudo crear el cliente</strong>
          <span>{error}</span>
        </section>
      )}

      <form className="form form-card" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input
            name="nombre"
            placeholder="Nombre del contacto"
            value={form.nombre}
            onChange={handleChange}
            disabled={formDisabled}
          />
          {fieldErrors.nombre && <small className="field-error">{fieldErrors.nombre}</small>}
        </label>

        <label>
          Empresa
          <input
            name="empresa"
            placeholder="Empresa o razon social"
            value={form.empresa}
            onChange={handleChange}
            disabled={formDisabled}
          />
          {fieldErrors.empresa && <small className="field-error">{fieldErrors.empresa}</small>}
        </label>

        <label>
          Email
          <input
            name="email"
            placeholder="correo@empresa.cl"
            type="email"
            value={form.email}
            onChange={handleChange}
            disabled={formDisabled}
          />
          {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
        </label>

        <label>
          Telefono
          <input
            name="telefono"
            placeholder="+56912345678"
            value={form.telefono}
            onChange={handleChange}
            disabled={formDisabled}
          />
          {fieldErrors.telefono && <small className="field-error">{fieldErrors.telefono}</small>}
        </label>

        <label>
          Rubro
          <input
            name="rubro"
            placeholder="Aves, Cerdos, Rumiantes..."
            value={form.rubro}
            onChange={handleChange}
            disabled={formDisabled}
          />
          {fieldErrors.rubro && <small className="field-error">{fieldErrors.rubro}</small>}
        </label>

        <label>
          Region
          <select
            name="region"
            value={form.region}
            onChange={handleChange}
            disabled={formDisabled}
          >
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
          <select
            name="estado"
            value={form.estado}
            onChange={handleChange}
            disabled={formDisabled}
          >
            {CLIENTE_ESTADOS.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </label>

        <div className="form-actions">
          <Link to="/clientes">
            <button className="btn-secondary" type="button">
              Cancelar
            </button>
          </Link>

          <button type="submit" disabled={formDisabled}>
            {saving ? "Guardando..." : "Guardar Cliente"}
          </button>
        </div>
      </form>

      {success && (
        <div className="modal-backdrop" role="status" aria-live="polite">
          <section className="success-modal">
            <span className="success-icon">OK</span>
            <h2>Cliente creado</h2>
            <p>{success}</p>
            <small>Volviendo al CRM...</small>
          </section>
        </div>
      )}
    </main>
  );
}

export default CrearCliente;
