# EVM - Semana 05 (17 mayo - 10 julio 2026)

## Datos del proyecto

| Campo | Valor |
|-------|-------|
| Proyecto | Enci Ventas MVP Web |
| Sprint | Sprint 05 + cierre de proyecto |
| Fecha de corte | 10 julio 2026 |
| Alcance evaluado | UAT readiness, ajustes de cierre CRM web, seguridad frontend y documentacion |

## Metricas EVM

| Metrica | Sigla | Valor | Descripcion |
|---------|-------|-------|-------------|
| Planned Value | PV | 36 pts | Readiness, guia UAT, cierre CRM web y documentacion |
| Earned Value | EV | 36 pts | Cierre web completado para Development |
| Actual Cost | AC | 36 pts | Esfuerzo equivalente invertido |
| Schedule Variance | SV = EV - PV | 0 pts | Sin atraso respecto del cierre web |
| Cost Variance | CV = EV - AC | 0 pts | Sin sobrecosto relativo |
| Schedule Performance Index | SPI = EV/PV | 1.0 | En tiempo |
| Cost Performance Index | CPI = EV/AC | 1.0 | En costo |

## Trabajo completado

| Ticket | Descripcion | Puntos | Estado |
|--------|-------------|--------|--------|
| EV-050 | Checklist UAT funcional por rol | 4 | Completado |
| EV-051 | Readiness backend para UAT/go-live | 5 | Completado |
| EV-052 | Runbook go-live y rollback | 4 | Completado |
| EV-053 | Smoke test post despliegue reproducible | 4 | Completado |
| EV-054 | Matriz de defectos UAT | 3 | Completado |
| EV-055 | Paginacion visual de clientes | 3 | Completado |
| EV-056 | Creacion/edicion web de oportunidades | 4 | Completado |
| EV-057 | Unicidad de email en clientes manuales | 3 | Completado |
| EV-058 | Cierre de vulnerabilidades frontend | 3 | Completado |
| EV-059 | Code splitting frontend sin warning de bundle | 3 | Completado |

## Resultado

La semana 05 deja el CRM web en proceso de cierre: los flujos criticos estan implementados, los controles de salida estan documentados y existe smoke test operativo para validar ambiente publicado.

## Evidencia

- `docs/qa/epic-05-uat-go-live.md`
- `tools/smoke_crm_web.py`
- `docs/cierre-proyecto.md`
- PR `Cierre proyecto CRM web`
