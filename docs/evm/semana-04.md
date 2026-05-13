# EVM - Semana 04 (10 mayo - 13 mayo 2026)

## Datos del proyecto

| Campo | Valor |
|-------|-------|
| Proyecto | Enci Ventas MVP |
| Sprint | Sprint 04 - EPIC 4 |
| Fecha de corte | 13 mayo 2026 |
| Alcance evaluado | Hardening, dashboards, navegacion por rol, QA y documentacion |

## Metricas EVM

| Metrica | Sigla | Valor | Descripcion |
|---------|-------|-------|-------------|
| Planned Value | PV | 18 pts | Hardening frontend, QA/E2E y dashboards |
| Earned Value | EV | 18 pts | EPIC 4 cerrado para Development |
| Actual Cost | AC | 18 pts | Esfuerzo equivalente invertido |
| Schedule Variance | SV = EV - PV | 0 pts | Sin atraso relativo |
| Cost Variance | CV = EV - AC | 0 pts | Sin sobrecosto relativo |
| Schedule Performance Index | SPI = EV/PV | 1.0 | En tiempo |
| Cost Performance Index | CPI = EV/AC | 1.0 | En costo |

## Trabajo completado

| Ticket | Descripcion | Puntos | Estado |
|--------|-------------|--------|--------|
| EV-040 | Manejo global de sesion expirada en frontend | 3 | Completado |
| EV-041 | Pagina 404 real para rutas inexistentes | 2 | Completado |
| EV-042 | Estados vacios en metricas de dashboard supervisor | 2 | Completado |
| EV-043 | Plan de QA/E2E para flujos criticos sin migracion | 3 | Completado |
| EV-044 | Hardening de navegacion por rol | 5 | Completado |
| EV-045 | Validacion visual manual de dashboards | 3 | Completado |

## QA ejecutado

```bash
cd Backend
uv run pytest
```

Resultado: `38 passed`.

```bash
cd frontend
npm.cmd run lint
npm.cmd run build
```

Resultado: lint y build exitosos.

## Observaciones

- Se agrego pantalla 403 para rutas autenticadas sin rol suficiente.
- `ProtectedRoute` valida rol minimo antes de renderizar contenido privado.
- El selector temporal de rol queda desactivado por defecto y solo opera en desarrollo si se habilita explicitamente.
- La migracion historica queda diferida y documentada fuera de alcance.

## Estado general

```text
Semana 01 Sprint 01 100%
Semana 02 EPIC 2 100%
Semana 03 EPIC 3 100%
Semana 04 EPIC 4 100%
Siguiente: EPIC 5 UAT y go-live
```
