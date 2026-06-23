import { describe, expect, it } from "vitest";

import {
  buildForecastFilename,
  buildForecastMetadata,
  buildForecastSeries,
  enrichForecastSeries,
  serializeAnalyticalForecastCsv,
  serializeSimpleForecastCsv,
  summarizeForecast,
} from "./forecastExport";

const referenceDate = new Date("2026-06-22T12:00:00-04:00");

describe("forecastExport", () => {
  it("construye la serie mensual respetando el vendedor seleccionado", () => {
    const points = buildForecastSeries({
      granularity: "mensual",
      referenceDate,
      sellerUid: "seller-1",
      opportunities: [
        { vendedorUid: "seller-1", updatedAt: "2026-06-10", valorEstimado: 1000, probabilidad: 50 },
        { vendedorUid: "seller-2", updatedAt: "2026-06-10", valorEstimado: 9000, probabilidad: 100 },
      ],
      proposals: [{ vendedorUid: "seller-1", estado: "aceptada", updatedAt: "2026-06-12", montoTotal: 300 }],
    });

    expect(points.at(-1)).toMatchObject({ periodo: "2026-06", proyeccionPonderada: 500, ventaReal: 300 });
  });

  it("adapta la serie a semanas calendario del mes activo", () => {
    const points = buildForecastSeries({
      granularity: "semanal",
      referenceDate,
      opportunities: [{ updatedAt: "2026-06-09", valorEstimado: 1000, probabilidad: 40 }],
      proposals: [{ estado: "aceptada", updatedAt: "2026-06-15", montoTotal: 250 }],
    });

    expect(points).toHaveLength(5);
    expect(points[1]).toMatchObject({
      etiqueta: "Sem 2",
      periodo: "2026-06-08/2026-06-14",
      proyeccionPonderada: 400,
    });
    expect(points[2]).toMatchObject({ ventaReal: 250 });
  });

  it("calcula brechas y protege divisiones por cero", () => {
    const rows = enrichForecastSeries([
      { periodo: "2026-06", proyeccionPonderada: 120, ventaReal: 100 },
      { periodo: "2026-05", proyeccionPonderada: 50, ventaReal: 0 },
    ], 100);

    expect(rows[0]).toMatchObject({
      delta_forecast_vs_real: 20,
      cumplimiento_real_pct: 100,
      cumplimiento_forecast_pct: 120,
      variacion_forecast_vs_real_pct: 20,
      estado: "sobre meta",
    });
    expect(rows[1]).toMatchObject({ variacion_forecast_vs_real_pct: null, estado: "sin ventas" });
  });

  it("genera CSV analítico con metadata, resumen y columnas estables", () => {
    const rows = enrichForecastSeries([{ periodo: "2026-06", proyeccionPonderada: 120, ventaReal: 100 }], 150);
    const metadata = buildForecastMetadata({
      generatedAt: referenceDate,
      granularity: "mensual",
      period: "2026-06",
      role: "supervisor",
      seller: "Juan Pérez",
      user: "Supervisor Enci",
      zone: "Zona centro",
    });
    const csv = serializeAnalyticalForecastCsv({ metadata, rows, summary: summarizeForecast(rows, 150) });

    const csvLines = csv.replace("\uFEFF", "").split("\r\n");

    expect(csvLines[0]).toBe("sep=,");
    expect(csv).toContain("\r\n\r\nMETADATA,VALOR\r\n");
    expect(csv).toContain("\r\n\r\nRESUMEN,VALOR\r\n");
    expect(csv).toContain("\r\n\r\nDATOS,VALOR\r\n");
    expect(csv).toContain("nombre_reporte,Forecast vs Real");
    expect(csv).toContain("total_forecast,120");
    expect(csv).toContain("periodo,proyeccion_ponderada,venta_real,meta_periodo");
    expect(csv).toContain("2026-06,120,100,150");
    expect(csv).toContain("66.67");
  });

  it("solo entrecomilla texto que requiere escape CSV", () => {
    const csv = serializeAnalyticalForecastCsv({
      metadata: { nota: "Forecast, ventas y meta" },
      rows: [{ periodo: "2026-06", cumplimiento_real_pct: 36.2 }],
      summary: {},
    });

    expect(csv).toContain('nota,"Forecast, ventas y meta"');
    expect(csv).toContain("2026-06,36.20");
  });

  it("conserva el CSV simple de tres columnas", () => {
    const csv = serializeSimpleForecastCsv([{ periodo: "2026-06", proyeccionPonderada: 120, ventaReal: 100 }]);
    expect(csv.trim().split("\r\n")).toHaveLength(2);
    expect(csv).toContain('"Periodo","Proyeccion ponderada","Venta real"');
  });

  it("genera un filename descriptivo y seguro", () => {
    expect(buildForecastFilename({
      generatedAt: referenceDate,
      granularity: "mensual",
      period: "2026-02_a_2026-06",
      seller: "Juan Pérez",
    })).toBe("forecast-mensual-2026-02-a-2026-06-juan-perez-analitico-202606221600.csv");
  });
});
