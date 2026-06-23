# Exportación analítica de Forecast

El panel **Forecast vs Real** del dashboard permite exportar el contexto comercial visible en CSV.

## Modos

- **CSV analítico:** incluye metadata, resumen agregado y serie temporal enriquecida.
- **CSV simple:** mantiene el contrato histórico `Periodo`, `Proyeccion ponderada`, `Venta real`.

Ambos modos respetan la granularidad semanal o mensual y el vendedor seleccionado. Para supervisores, `Equipo completo` representa el dataset consolidado autorizado por el backend; para vendedores, el backend y la interfaz limitan el reporte a su propia cuenta.

## Estructura analítica

El archivo se divide en tres bloques:

1. `METADATA`: usuario, rol, fecha, vendedor, período, zona, moneda, filtros, fuente y versión del esquema.
2. `RESUMEN`: totales, cumplimiento global y brechas contra la meta de referencia.
3. Serie temporal: forecast, venta real, meta, deltas, porcentajes y estado por período.

La meta es la misma referencia única visible en el gráfico. Se replica en cada fila para facilitar filtros y análisis, pero no se suma al calcular el resumen. Los porcentajes se exportan como valores numéricos en escala 0–100; una división sin denominador válido queda vacía.

## Versión

El esquema actual es `1.0`. La generación está encapsulada en `frontend/src/utils/forecastExport.js`, lo que permite incorporar posteriormente un serializador XLSX sin modificar los cálculos ni el componente visual.
