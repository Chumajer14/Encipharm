# EVM - Semana 03 (5-9 mayo 2026)

## Datos del proyecto

| Campo | Valor |
|-------|-------|
| Proyecto | Enci Ventas MVP Web |
| Sprint | Sprint 03 - EPIC 3 |
| Fecha de corte | 9 mayo 2026 |
| Alcance evaluado | Interacciones, oportunidades, propuestas y dashboard supervisor |

## Metricas EVM

| Metrica | Sigla | Valor | Descripcion |
|---------|-------|-------|-------------|
| Planned Value | PV | 34 pts | Flujo comercial minimo y relacion cliente-oportunidad-propuesta |
| Earned Value | EV | 34 pts | Flujo comercial completado |
| Actual Cost | AC | 34 pts | Esfuerzo equivalente invertido |
| Schedule Variance | SV = EV - PV | 0 pts | Sin atraso |
| Cost Variance | CV = EV - AC | 0 pts | Sin sobrecosto relativo |
| Schedule Performance Index | SPI = EV/PV | 1.0 | En tiempo |
| Cost Performance Index | CPI = EV/AC | 1.0 | En costo |

## Trabajo completado

| Ticket | Descripcion | Puntos | Estado |
|--------|-------------|--------|--------|
| EV-023 | API de interacciones y visitas | 4 | Completado |
| EV-024 | API de oportunidades y pipeline | 5 | Completado |
| EV-025 | API de propuestas con calculo basico | 5 | Completado |
| EV-026 | Relacion cliente-oportunidad-propuesta | 4 | Completado |
| EV-027 | UI de interacciones | 3 | Completado |
| EV-028 | UI de pipeline y filtros | 4 | Completado |
| EV-029 | UI de propuestas y estados | 3 | Completado |
| EV-030 | QA automatizado base | 3 | Completado |
| EV-031 | Detalle de oportunidad e historial comercial | 3 | Completado |

## Resultado

La semana 03 deja cerrado el flujo comercial base del CRM web: el usuario autorizado puede registrar interacciones, crear oportunidades, cambiar etapas, crear propuestas y revisar la trazabilidad comercial por cliente u oportunidad.

## Evidencia

- `docs/sprints/sprint-03.md`
- `docs/api/comercial.md`
- `Backend/tests/test_comercial_flow.py`
