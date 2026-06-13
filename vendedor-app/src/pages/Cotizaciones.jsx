import { useEffect, useState } from "react";
import { db } from "../db/dexie";
import { crearOportunidad, getClientes } from "../services/api";

function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cargarCotizaciones = async () => {
    const data = await db.cotizaciones.toArray();
    setCotizaciones(data);
  };

  return (
    <main className="mobile-page">
      <h1>Mis Cotizaciones</h1>

      <div className="cotizaciones-list">
        {cotizaciones.map((item) => (
          <div className="cotizacion-card" key={item.id}>
            <h2>{item.cliente}</h2>

            <p>
              <strong>Producto:</strong>{" "}
              {item.productoNombre}
            </p>

            <p>
              <strong>Categoría:</strong>{" "}
              {item.productoCategoria}
            </p>

            <p>
              <strong>Monto:</strong> $
              {item.monto}
            </p>

            <p>
              <strong>Probabilidad:</strong>{" "}
              {item.probabilidad}%
            </p>

            <p>
              <strong>Valor ponderado:</strong> $
              {item.valorPonderado}
            </p>

            <p>
              <strong>Etapa:</strong>{" "}
              {item.estado}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}

export default Cotizaciones;