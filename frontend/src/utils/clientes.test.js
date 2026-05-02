import test from "node:test";
import assert from "node:assert/strict";
import { filtrarClientes } from "./clientes.js";

const clientes = [
  {
    id: "cli_001",
    nombre: "Joshua Perez",
    empresa: "Agricola del Sur",
    rubro: "Aves",
    region: "Los Lagos",
    estado: "Completado",
  },
  {
    id: "cli_002",
    nombre: "Nicolas Gonzales",
    empresa: "Granja Los Pinos",
    rubro: "Cerdos",
    region: "Maule",
    estado: "En proceso",
  },
];

test("filtrarClientes permite busqueda por empresa, rubro y region", () => {
  const resultados = filtrarClientes(clientes, "aves");

  assert.equal(resultados.length, 1);
  assert.equal(resultados[0].rubro, "Aves");
});

test("filtrarClientes devuelve todos los clientes si no hay busqueda", () => {
  assert.equal(filtrarClientes(clientes, "").length, clientes.length);
});
