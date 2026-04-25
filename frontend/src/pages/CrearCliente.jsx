import { useState } from "react";

function CrearCliente() {
  const [form, setForm] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    rubro: "",
    region: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Cliente creado:", form);

    alert("Cliente creado (mock)");

    // limpiar formulario
    setForm({
      nombre: "",
      empresa: "",
      email: "",
      telefono: "",
      rubro: "",
      region: ""
    });
  };

  return (
    <main className="page">
      <h1>Nuevo Cliente</h1>

      <form className="form" onSubmit={handleSubmit}>
        
        <input
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
        />

        <input
          name="empresa"
          placeholder="Empresa"
          value={form.empresa}
          onChange={handleChange}
        />

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />

        <input
          name="telefono"
          placeholder="Teléfono"
          value={form.telefono}
          onChange={handleChange}
        />

        <input
          name="rubro"
          placeholder="Rubro (Aves, Cerdos...)"
          value={form.rubro}
          onChange={handleChange}
        />

        <input
          name="region"
          placeholder="Región"
          value={form.region}
          onChange={handleChange}
        />

        <button type="submit">Guardar Cliente</button>

      </form>
    </main>
  );
}

export default CrearCliente;