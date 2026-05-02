import test from "node:test";
import assert from "node:assert/strict";
import { mockClientes } from "./mockClientes.js";

test("mockClientes contiene datos base para validar el CRM", () => {
  assert.ok(mockClientes.length >= 1);

  for (const cliente of mockClientes) {
    assert.ok(cliente.id);
    assert.ok(cliente.nombre);
    assert.ok(cliente.empresa);
    assert.ok(cliente.rubro);
    assert.ok(cliente.region);
    assert.ok(cliente.estado);
  }
});

test("mockClientes permite busqueda por empresa, rubro y region", () => {
  const texto = "aves";
  const resultados = mockClientes.filter((cliente) => (
    cliente.nombre.toLowerCase().includes(texto) ||
    cliente.empresa.toLowerCase().includes(texto) ||
    cliente.rubro.toLowerCase().includes(texto) ||
    cliente.region.toLowerCase().includes(texto)
  ));

  assert.equal(resultados.length, 1);
  assert.equal(resultados[0].rubro, "Aves");
});
