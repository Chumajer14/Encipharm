# EVM - Semana 04 (10-16 mayo 2026)

## Datos del proyecto

| Campo | Valor |
|-------|-------|
| Proyecto | Enci Ventas MVP Web |
| Sprint | Sprint 04 - EPIC 4 |
| Fecha de corte | 16 mayo 2026 |
| Alcance evaluado | Hardening, QA, rutas protegidas y dashboards |

## Metricas EVM

| Metrica | Sigla | Valor | Descripcion |
|---------|-------|-------|-------------|
| Planned Value | PV | 24 pts | Seguridad, sesion, dashboards y QA |
| Earned Value | EV | 24 pts | Hardening y QA completados |
| Actual Cost | AC | 24 pts | Esfuerzo equivalente invertido |
| Schedule Variance | SV = EV - PV | 0 pts | Sin atraso |
| Cost Variance | CV = EV - AC | 0 pts | Sin sobrecosto relativo |
| Schedule Performance Index | SPI = EV/PV | 1.0 | En tiempo |
| Cost Performance Index | CPI = EV/AC | 1.0 | En costo |

## Trabajo completado

| Ticket | Descripcion | Puntos | Estado |
|--------|-------------|--------|--------|
| EV-040 | Manejo global de sesion expirada | 4 | Completado |
| EV-041 | Pagina 404 controlada | 3 | Completado |
| EV-042 | Estados vacios en dashboards | 3 | Completado |
| EV-043 | Plan QA de flujos criticos | 4 | Completado |
| EV-044 | Navegacion por rol | 4 | Completado |
| EV-045 | Validacion visual manual | 3 | Completado |
| EV-046 | Hardening defensivo backend | 3 | Completado |

## Resultado

La semana 04 deja el MVP web endurecido para UAT: rutas privadas con rol minimo, errores 403/404 controlados, bloqueo de usuarios inactivos, headers de seguridad, limite de payload, rate limit y documentacion QA.

## Evidencia

- `docs/sprints/sprint-04.md`
- `docs/qa/epic-04-hardening.md`
- `docs/qa/auditoria-seguridad-defensiva-2026-05-19.md`
