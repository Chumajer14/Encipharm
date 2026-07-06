import { weightedValue } from "./commercialAnalytics";

export const FORECAST_EXPORT_SCHEMA_VERSION = "1.0";

const OPEN_STAGES = new Set(["nuevo", "contactado", "cotizacion", "negociacion"]);

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((numeric(value) + Number.EPSILON) * factor) / factor;
}

function recordDate(record) {
  const raw = record?.updatedAt || record?.createdAt || record?.fecha;
  const dateOnlyMatch = typeof raw === "string" ? raw.match(/^(\d{4})-(\d{2})-(\d{2})$/) : null;
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function filterBySeller(records, sellerUid) {
  return sellerUid ? records.filter((record) => record.vendedorUid === sellerUid) : records;
}

function aggregatePeriod(opportunities, proposals, matchesPeriod) {
  return {
    proyeccionPonderada: round(
      opportunities.filter(matchesPeriod).reduce((total, opportunity) => total + weightedValue(opportunity), 0),
    ),
    ventaReal: round(
      proposals
        .filter((proposal) => proposal.estado === "aceptada" && matchesPeriod(proposal))
        .reduce((total, proposal) => total + numeric(proposal.montoTotal), 0),
    ),
  };
}

/**
 * Construye la misma serie base utilizada por el gráfico y por la exportación.
 * La vista semanal representa las cinco semanas calendario posibles del mes actual;
 * la mensual representa los cinco meses terminando en el mes de referencia.
 */
export function buildForecastSeries({
  granularity,
  opportunities = [],
  proposals = [],
  referenceDate = new Date(),
  sellerUid = "",
}) {
  const scopedOpportunities = filterBySeller(opportunities, sellerUid);
  const scopedProposals = filterBySeller(proposals, sellerUid);

  if (granularity === "semanal") {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: 5 }, (_, index) => {
      const week = index + 1;
      const startDay = index * 7 + 1;
      const endDay = Math.min(startDay + 6, lastDay);
      const start = new Date(year, month, Math.min(startDay, lastDay));
      const end = new Date(year, month, endDay);
      const matchesPeriod = (record) => {
        const date = recordDate(record);
        return date
          && date.getFullYear() === year
          && date.getMonth() === month
          && Math.min(Math.floor((date.getDate() - 1) / 7) + 1, 5) === week;
      };

      return {
        etiqueta: `Sem ${week}`,
        periodo: `${dateKey(start)}/${dateKey(end)}`,
        ...aggregatePeriod(scopedOpportunities, scopedProposals, matchesPeriod),
      };
    });
  }

  const monthFormatter = new Intl.DateTimeFormat("es-CL", { month: "short" });
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - (4 - index), 1);
    const period = monthKey(date);
    const matchesPeriod = (record) => {
      const dateValue = recordDate(record);
      return dateValue && monthKey(dateValue) === period;
    };

    return {
      etiqueta: monthFormatter.format(date).replace(".", "").replace(/^./, (letter) => letter.toUpperCase()),
      periodo: period,
      ...aggregatePeriod(scopedOpportunities, scopedProposals, matchesPeriod),
    };
  });
}

/** Calcula el valor de referencia que la vista presenta como meta. */
export function calculateForecastTarget({ opportunities = [], proposals = [], sellerUid = "" }) {
  const scopedOpportunities = filterBySeller(opportunities, sellerUid);
  const scopedProposals = filterBySeller(proposals, sellerUid);
  const pipeline = scopedOpportunities
    .filter((item) => OPEN_STAGES.has(item.etapa || "nuevo"))
    .reduce((total, item) => total + numeric(item.valorEstimado), 0);
  const real = scopedProposals
    .filter((item) => item.estado === "aceptada")
    .reduce((total, item) => total + numeric(item.montoTotal), 0);
  return round(Math.max(pipeline, real));
}

function percentage(numerator, denominator) {
  return denominator > 0 ? round((numerator / denominator) * 100) : null;
}

function rowStatus({ forecast, real, target }) {
  if (forecast === 0 && real === 0) return "sin datos";
  if (real === 0) return "sin ventas";
  if (target > 0 && real >= target) return "sobre meta";
  if (target > 0 && forecast >= target) return "forecast sobre meta";
  if (target > 0) return "bajo meta";
  return forecast > real ? "forecast sobre real" : "sin meta";
}

/** Enriquece la serie temporal con brechas, cumplimiento y estado comercial. */
export function enrichForecastSeries(points, target) {
  const meta = numeric(target);
  return points.map((point) => {
    const forecast = numeric(point.proyeccionPonderada);
    const real = numeric(point.ventaReal);
    return {
      periodo: point.periodo || point.etiqueta,
      proyeccion_ponderada: round(forecast),
      venta_real: round(real),
      meta_periodo: round(meta),
      delta_forecast_vs_real: round(forecast - real),
      delta_real_vs_meta: round(real - meta),
      delta_forecast_vs_meta: round(forecast - meta),
      cumplimiento_real_pct: percentage(real, meta),
      cumplimiento_forecast_pct: percentage(forecast, meta),
      variacion_forecast_vs_real_pct: percentage(forecast - real, real),
      estado: rowStatus({ forecast, real, target: meta }),
    };
  });
}

/** Resume el período sin sumar la meta replicada de cada fila. */
export function summarizeForecast(rows, target) {
  const totalForecast = round(rows.reduce((total, row) => total + row.proyeccion_ponderada, 0));
  const totalReal = round(rows.reduce((total, row) => total + row.venta_real, 0));
  const meta = numeric(target);
  return {
    total_forecast: totalForecast,
    total_real: totalReal,
    meta_referencia: round(meta),
    cumplimiento_global_real_pct: percentage(totalReal, meta),
    cumplimiento_global_forecast_pct: percentage(totalForecast, meta),
    brecha_global_real_vs_meta: round(totalReal - meta),
    brecha_global_forecast_vs_meta: round(totalForecast - meta),
  };
}

/** Construye los metadatos trazables del contexto visible al exportar. */
export function buildForecastMetadata({
  generatedAt = new Date(),
  granularity,
  period,
  role,
  seller,
  user,
  zone,
}) {
  return {
    nombre_reporte: "Forecast vs Real",
    vista_exportada: granularity,
    generado_en: generatedAt.toISOString(),
    usuario_exportador: user || "Usuario Enci",
    rol_usuario: role || "sin rol",
    filtros_aplicados: `granularidad=${granularity}; vendedor=${seller || "equipo completo"}`,
    vendedor_seleccionado: seller || "equipo completo",
    periodo_consultado: period || "sin período",
    zona: zone || "todas las zonas",
    moneda: "CLP",
    schema_exportacion: FORECAST_EXPORT_SCHEMA_VERSION,
    fuente_datos: "Dashboard comercial Enci",
    logica_meta: "Referencia única visible en el gráfico; se replica por fila y no se suma en el resumen.",
  };
}

function csvCell(value) {
  if (value === null || value === undefined) return "";
  return `"${String(value).replaceAll('"', '""')}"`;
}

function serializeRows(rows) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function analyticalCsvCell(value, column = "") {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return column.endsWith("_pct") ? value.toFixed(2) : String(value);
  }

  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function serializeAnalyticalRow(values, columns = []) {
  return values.map((value, index) => analyticalCsvCell(value, columns[index])).join(",");
}

/**
 * Serializa bloques visuales y conserva los números sin comillas. La directiva
 * `sep=,` evita que Excel en español interprete la fila completa como una celda.
 */
export function serializeAnalyticalForecastCsv({ metadata, rows, summary }) {
  const headers = Object.keys(rows[0] || {
    periodo: "",
    proyeccion_ponderada: "",
    venta_real: "",
    meta_periodo: "",
  });
  const output = [
    { values: [] },
    { values: ["METADATA", "VALOR"] },
    ...Object.entries(metadata).map(([key, value]) => ({ values: [key, value] })),
    { values: [] },
    { values: ["RESUMEN", "VALOR"] },
    ...Object.entries(summary).map(([key, value]) => ({ values: [key, value], columns: ["", key] })),
    { values: [] },
    { values: ["DATOS", "VALOR"] },
    { values: headers },
    ...rows.map((row) => ({ values: headers.map((header) => row[header]), columns: headers })),
  ];
  const content = output.map(({ values, columns }) => serializeAnalyticalRow(values, columns)).join("\r\n");
  return `\uFEFFsep=,\r\n${content}`;
}

/** Mantiene disponible el contrato histórico de tres columnas. */
export function serializeSimpleForecastCsv(points) {
  return `\uFEFF${serializeRows([
    ["Periodo", "Proyeccion ponderada", "Venta real"],
    ...points.map((point) => [point.periodo || point.etiqueta, point.proyeccionPonderada, point.ventaReal]),
  ])}`;
}

function slug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "sin-filtro";
}

/** Genera un nombre trazable sin caracteres problemáticos para el sistema operativo. */
export function buildForecastFilename({ granularity, period, seller, generatedAt = new Date(), simple = false }) {
  const timestamp = generatedAt.toISOString().slice(0, 16).replace(/[-:T]/g, "");
  return [
    "forecast",
    granularity,
    period,
    seller || "equipo-completo",
    simple ? "simple" : "analitico",
    timestamp,
  ].map(slug).join("-") + ".csv";
}

/** Descarga un CSV ya construido y libera inmediatamente la URL temporal. */
export function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
