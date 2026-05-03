import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { regionesChile } from "../data/regionesChile";
import { createCliente } from "../services/api";
import { getFriendlyApiError } from "../utils/apiErrors";

const initialForm = {
  nombre: "",
  empresa: "",
  email: "",
  telefono: "",
  rubro: "",
  region: "",
  estado: "En proceso",
};

function CrearCliente() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { idToken } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const createdCliente = await createCliente(idToken, form);
      const successMessage = `Cliente ${createdCliente.empresa} creado exitosamente.`;

      setSuccess(successMessage);
      setForm(initialForm);

      window.setTimeout(() => {
        navigate("/clientes", { //AL DAR BOTON VOLVER SE DEVUELVE A CRM CLIENTES
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
            required
            disabled={formDisabled}
          />
        </label>

        <label>
          Empresa
          <input
            name="empresa"
            placeholder="Empresa o razón social"
            value={form.empresa}
            onChange={handleChange}
            required
            disabled={formDisabled}
          />
        </label>

        <label>
          Email
          <input
            name="email"
            placeholder="correo@empresa.cl"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            disabled={formDisabled}
          />
        </label>

        <label>
          Teléfono
          <input
            name="telefono"
            placeholder="+56912345678"
            value={form.telefono}
            onChange={handleChange}
            disabled={formDisabled}
          />
        </label>

        <label>
          Rubro
          <input
            name="rubro"
            placeholder="Aves, Cerdos, Rumiantes..."
            value={form.rubro}
            onChange={handleChange}
            required
            disabled={formDisabled}
          />
        </label>

        <label>
          Región
          <select
            name="region"
            value={form.region}
            onChange={handleChange}
            required
            disabled={formDisabled}
          >
            <option value="">Selecciona una región</option>
            {regionesChile.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>

        <label>
          Estado
          <select
            name="estado"
            value={form.estado}
            onChange={handleChange}
            disabled={formDisabled}
          >
            <option value="En proceso">En proceso</option>
            <option value="Completado">Completado</option>
          </select>
        </label>

        <div className="form-actions">
          <Link to="/">
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