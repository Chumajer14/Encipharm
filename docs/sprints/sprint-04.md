# Sprint 04 - EPIC 4: Hardening, QA y dashboards

**Fecha de inicio:** 10 mayo 2026

**Rama:** `feature-epic-4-hardening-qa`

**Estado:** En desarrollo

## Objetivo

Endurecer el MVP web antes de UAT con foco en seguridad frontend, resiliencia visual, dashboards y QA automatizable. La migracion de datos queda fuera de este sprint por decision de alcance.

## Alcance inicial

| Ticket | Descripcion | Area | Estado |
|--------|-------------|------|--------|
| EV-040 | Manejo global de sesion expirada en frontend | Frontend | Completado |
| EV-041 | Pagina 404 real para rutas inexistentes | Frontend | Completado |
| EV-042 | Estados vacios en metricas de dashboard supervisor | Frontend | Completado |
| EV-043 | Plan de QA/E2E para flujos criticos sin migracion | QA | Pendiente |
| EV-044 | Hardening de navegacion por rol | Frontend | Pendiente |
| EV-045 | Validacion visual manual de dashboards | QA | Pendiente |

## Fuera de alcance

- Migracion de datos historicos.
- Importadores nuevos.
- Integraciones externas.

## Criterios de aceptacion

- Un token expirado cierra sesion y redirige al login con mensaje claro.
- Una ruta inexistente muestra una pagina 404 y permite volver al flujo principal.
- Dashboard supervisor no muestra paneles vacios ambiguos cuando no hay datos.
- Build y lint frontend se mantienen limpios.

## QA ejecutado

```bash
cd frontend
npm.cmd run build
npm.cmd run lint
```
