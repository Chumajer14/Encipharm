import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { createCliente } from "../services/api";

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

    try {
      await createCliente(idToken, form);
      setForm(initialForm);
      navigate("/");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <section className="header header-row">
        <div>
          <h1>Nuevo Cliente</h1>
          <p>Registro real en Firestore para el MVP comercial</p>
        </div>
        <Link to="/">
          <button className="btn-secondary" type="button">
            Volver
          </button>
        </Link>
      </section>

      <form className="form" onSubmit={handleSubmit}>
        <input
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />

        <input
          name="empresa"
          placeholder="Empresa"
          value={form.empresa}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="telefono"
          placeholder="Telefono"
          value={form.telefono}
          onChange={handleChange}
        />

        <input
          name="rubro"
          placeholder="Rubro (Aves, Cerdos...)"
          value={form.rubro}
          onChange={handleChange}
          required
        />

        <input
          name="region"
          placeholder="Region"
          value={form.region}
          onChange={handleChange}
          required
        />

        <select name="estado" value={form.estado} onChange={handleChange}>
          <option value="En proceso">En proceso</option>
          <option value="Completado">Completado</option>
        </select>

        {error && <p className="status-message error">{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar Cliente"}
        </button>
      </form>
    </main>
  );
}

export default CrearCliente;
