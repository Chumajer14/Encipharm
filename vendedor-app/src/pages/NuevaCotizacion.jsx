import { useEffect, useState } from "react";
import { db } from "../db/dexie";
import { products } from "../data/products";
import { crearOportunidad, getClientes } from "../services/api";
import { ETAPAS, toBackendStage } from "../utils/etapas";

const initialForm = {
  clienteId: "",
  cliente: "",
  productoId: "",
  productoNombre: "",
  productoCategoria: "",
  monto: "",
  probabilidad: 55,
  estado: "Prospeccion",
  comentario: "",
};

function NuevaCotizacion({ token }) {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    async function cargarClientes() {
      try {
        const data = await getClientes(token);
        setClientes(data);
      } catch (error) {
        console.error("Error cargando clientes:", error);
        setMensaje("No se pudieron cargar clientes desde el backend.");
      }
    }

    if (token) {
      cargarClientes();
    }
  }, [token]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleClienteChange = (event) => {
    const cliente = clientes.find((item) => item.id === event.target.value);

    setForm({
      ...form,
      clienteId: cliente?.id || "",
      cliente: cliente?.empresa || cliente?.nombre || "",
    });
  };

  const handleProductChange = (event) => {
    const product = products.find((item) => item.id === Number(event.target.value));

    setForm({
      ...form,
      productoId: product?.id || "",
      productoNombre: product?.name || "",
      productoCategoria: product?.category || "",
    });
  };

  const guardar = async (event) => {
    event.preventDefault();
    setMensaje("");

    try {
      const oportunidadBackend = {
        clienteId: form.clienteId,
        titulo: `${form.cliente} - ${form.productoNombre}`,
        etapa: toBackendStage(form.estado),
        valorEstimado: Number(form.monto),
        probabilidad: Number(form.probabilidad),
        descripcion: form.comentario || "Cotizacion creada desde app vendedor",
      };

      const oportunidadCreada = await crearOportunidad(token, oportunidadBackend);
      const nuevaCotizacion = {
        ...form,
        monto: Number(form.monto),
        probabilidad: Number(form.probabilidad),
        valorPonderado: (Number(form.monto) * Number(form.probabilidad)) / 100,
        fecha: new Date().toISOString(),
        oportunidadId: oportunidadCreada.id,
        sincronizada: true,
      };

      await db.cotizaciones.add(nuevaCotizacion);

      setMensaje("Cotizacion guardada y enviada al dashboard.");
      setForm(initialForm);
    } catch (error) {
      console.error("Error al guardar:", error);
      setMensaje(error.message || "Error al guardar cotizacion.");
    }
  };

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="logo">E</div>
        <strong>Enci Ventas</strong>
      </header>

      <section className="page-title">
        <h1>Nueva Cotizacion</h1>
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
          min="0"
          placeholder="$"
          value={form.monto}
          onChange={handleChange}
          required
        />

        <div className="probability-box">
          <span>Probabilidad de exito</span>
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
          {ETAPAS.map((etapa) => (
            <option key={etapa}>{etapa}</option>
          ))}
        </select>

        <label>Comentario</label>
        <textarea
          name="comentario"
          placeholder="Proximos pasos o comentario comercial..."
          value={form.comentario}
          onChange={handleChange}
        />

        <button className="primary-btn" type="submit">
          Guardar cotizacion
        </button>
        {mensaje && <p className="form-message">{mensaje}</p>}
      </form>
    </main>
  );
}

export default NuevaCotizacion;
