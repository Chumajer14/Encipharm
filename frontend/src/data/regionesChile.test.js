import test from "node:test";
import assert from "node:assert/strict";
import { regionesChile } from "./regionesChile.js";

test("regionesChile contiene las 16 regiones de Chile", () => {
  assert.equal(regionesChile.length, 16);
  assert.ok(regionesChile.includes("Arica y Parinacota"));
  assert.ok(regionesChile.includes("Metropolitana de Santiago"));
  assert.ok(regionesChile.includes("Magallanes y de la Antartica Chilena"));
});
