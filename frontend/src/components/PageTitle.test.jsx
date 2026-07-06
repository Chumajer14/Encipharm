import { describe, expect, it } from "vitest";

import { resolvePageTitle } from "./pageTitles";

describe("resolvePageTitle", () => {
  it.each([
    ["/dashboard", "Enci Sales Command"],
    ["/clientes", "CRM Clientes | Enci"],
    ["/clientes/cliente-123", "Detalle de cliente | Enci"],
    ["/oportunidades/oportunidad-123", "Detalle de oportunidad | Enci"],
    ["/asistente", "Enci Chat"],
    ["/configuracion", "Configuración | Enci"],
    ["/ruta-inexistente", "Página no encontrada | Enci"],
  ])("resuelve %s como %s", (pathname, expectedTitle) => {
    expect(resolvePageTitle(pathname)).toBe(expectedTitle);
  });
});
