import { useEffect, useState } from "react";
import { db } from "../db/dexie";
import { products } from "../data/products";
import { crearOportunidad, getClientes } from "../services/api";

function NuevaCotizacion({ token }) {
  const [clientes, setClientes] = useState([]);

  const [form, setForm] = useState({
    clienteId: "",
    cliente: "",
    productoId: "",
    productoNombre: "",
    productoCategoria: "",
    monto: "",
    probabilidad: 55,
    estado: "Prospección",
    comentario: "",
  });

  useEffect(() => {
    async function cargarClientes() {
      try {
        const data = await getClientes(token);
        setClientes(data);
      } catch (error) {
        console.error("Error cargando clientes:", error);
      }
    }

    if (token) {
      cargarClientes();
    }
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleClienteChange = (e) => {
    const cliente = clientes.find((item) => item.id === e.target.value);

    setForm({
      ...form,
      clienteId: cliente?.id || "",
      cliente: cliente?.empresa || cliente?.nombre || "",
    });
  };

  const handleProductChange = (e) => {
    const product = products.find((p) => p.id === Number(e.target.value));

    setForm({
      ...form,
      productoId: product?.id || "",
      productoNombre: product?.name || "",
      productoCategoria: product?.category || "",
    });
  };

  const mapearEtapa = (estado) => {
    const mapa = {
      "Prospección": "nuevo",
      "Calificación": "contactado",
      "Propuesta": "cotizacion",
      "Negociación": "negociacion",
      "Cierre": "ganado",
      "Perdido": "perdido",
    };

    return mapa[estado] || "nuevo";
  };

  const guardar = async (e) => {
    e.preventDefault();

    try {
      const nuevaCotizacion = {
        ...form,
        monto: Number(form.monto),
        probabilidad: Number(form.probabilidad),
        valorPonderado:
          (Number(form.monto) * Number(form.probabilidad)) / 100,
        fecha: new Date().toISOString(),
      };

      await db.cotizaciones.add(nuevaCotizacion);

      const oportunidadBackend = {
        clienteId: form.clienteId,
        titulo: `${form.cliente} - ${form.productoNombre}`,
        etapa: mapearEtapa(form.estado),
        valorEstimado: Number(form.monto),
        probabilidad: Number(form.probabilidad),
        descripcion:
          form.comentario || "Cotización creada desde app vendedor",
      };

      await crearOportunidad(token, oportunidadBackend);

      alert("Cotización guardada y enviada al dashboard");

      setForm({
        clienteId: "",
        cliente: "",
        productoId: "",
        productoNombre: "",
        productoCategoria: "",
        monto: "",
        probabilidad: 55,
        estado: "Prospección",
        comentario: "",
      });
    } catch (error) {
      console.error("Error al guardar:", error);
      alert(error.message || "Error al guardar cotización");
    }
  };

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="logo">E</div>
        <strong>Enci Ventas</strong>
        <button className="icon-btn">⚙️</button>
      </header>

      <section className="page-title">
        <h1>📄 Nueva Cotización</h1>
        <p>Registra una propuesta comercial del vendedor</p>
      </section>

      <form className="form-card" onSubmit={guardar}>
        <label>Cliente</label>
        <select
          name="clienteId"
          value={form.clienteId}
          onChange={handleClienteChange}
          required
        >
          <option value="">Selecciona cliente</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.empresa || cliente.nombre}
            </option>
          ))}
        </select>

        <label>Producto</label>
        <select value={form.productoId} onChange={handleProductChange} required>
          <option value="">Selecciona producto</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} - {product.category}
            </option>
          ))}
        </select>

        <label>Monto cotizado</label>
        <input
          name="monto"
          type="number"
          placeholder="$"
          value={form.monto}
          onChange={handleChange}
          required
        />

        <div className="probability-box">
          <span>Probabilidad de éxito</span>
          <strong>{form.probabilidad}%</strong>
        </div>

        <input
          name="probabilidad"
          type="range"
          min="0"
          max="100"
          value={form.probabilidad}
          onChange={handleChange}
        />

        <label>Etapa</label>
        <select name="estado" value={form.estado} onChange={handleChange}>
          <option>Prospección</option>
          <option>Calificación</option>
          <option>Propuesta</option>
          <option>Negociación</option>
          <option>Cierre</option>
          <option>Perdido</option>
        </select>

        <label>Comentario</label>
        <textarea
          name="comentario"
          placeholder="Próximos pasos o comentario comercial..."
          value={form.comentario}
          onChange={handleChange}
        />

        <button className="primary-btn" type="submit">
          Guardar cotización
        </button>
      </form>
    </main>
  );
}

export default NuevaCotizacion;