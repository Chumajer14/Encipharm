import Dexie from "dexie";

export const db = new Dexie("encipharm_vendedor");

db.version(1).stores({
  cotizaciones:
    "++id, cliente, productoId, productoNombre, productoCategoria, estado, probabilidad, monto, valorPonderado, fecha",
});