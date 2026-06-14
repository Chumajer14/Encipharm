import { useEffect, useState } from "react";
import { db } from "../db/dexie";

function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);

  useEffect(() => {
    db.cotizaciones.toArray().then(setCotizaciones);
  }, []);

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
              <strong>Categoria:</strong>{" "}
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
