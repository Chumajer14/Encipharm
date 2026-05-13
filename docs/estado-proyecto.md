# Estado del proyecto - Enci Ventas MVP

**Fecha de corte:** 13 mayo 2026  
**Rama de cierre:** `feature-epic-4-hardening-qa`  
**PR:** `#41 feat(epic-4): cerrar hardening y QA`

## Resumen ejecutivo

El MVP web de Enci Ventas esta cerrado para Development hasta EPIC 4. La aplicacion cubre autenticacion Google/Firebase, API FastAPI protegida por Firebase Admin, CRM de clientes, usuarios/roles, importacion CSV, interacciones, oportunidades, propuestas, dashboards vendedor/supervisor y hardening frontend/backend previo a UAT.

La migracion de datos historicos, Flutter, IA/RAG, SAP, Google Calendar, inteligencia competitiva avanzada y reportes extendidos siguen fuera del MVP web actual.

## Estado por EPIC

| EPIC | Estado | Entregables principales | Evidencia |
|------|--------|-------------------------|-----------|
| EPIC 1 | Cerrado | Base FastAPI, Firebase Auth/JWT, perfil usuario | `docs/sprints/sprint-01.md` |
| EPIC 2 | Cerrado | CRM, login web, roles, CSV, dashboard base | `docs/sprints/sprint-02-cierre.md` |
| EPIC 3 | Cerrado Development | Interacciones, oportunidades, propuestas, detalle comercial | `docs/sprints/sprint-03.md` |
| EPIC 4 | Cerrado Development | Hardening sesion, 404/403, dashboard estable, QA/E2E documentado | `docs/sprints/sprint-04.md`, `docs/qa/epic-04-hardening.md` |
| EPIC 5 | Pendiente | UAT, correcciones finales, go-live | Por planificar |

## Capacidades disponibles

- Login Google con Firebase Auth.
- Sincronizacion de usuario en Firestore mediante `/auth/login`.
- Autorizacion backend por `admin`, `supervisor` y `vendedor`.
- CRM de clientes con alta, listado, filtros, detalle, edicion y baja logica.
- Importacion CSV atomica para supervisores/admin.
- Registro de interacciones comerciales.
- Pipeline de oportunidades con etapas.
- Propuestas vinculadas a oportunidad y calculo server-side.
- Dashboard vendedor con datos propios.
- Dashboard supervisor/admin con consolidado comercial.
- Manejo global de sesion expirada.
- Paginas controladas 404 y 403.
- Despliegue frontend preparado para Vercel.

## QA acumulado

| Area | Comando / evidencia | Resultado |
|------|---------------------|-----------|
| Backend | `cd Backend && uv run pytest` | 38 passed |
| Frontend lint | `cd frontend && npm.cmd run lint` | Exitoso |
| Frontend build | `cd frontend && npm.cmd run build` | Exitoso |
| QA EPIC 4 | `docs/qa/epic-04-hardening.md` | Cerrado Development |

## Riesgos y decisiones

| Riesgo / decision | Estado | Accion siguiente |
|-------------------|--------|------------------|
| Login Firebase real requiere ambiente configurado | Abierto para UAT | Validar dominios autorizados y usuarios reales. |
| E2E frontend aun no automatizado | Abierto | Definir estrategia Playwright con login mockeado o Firebase test. |
| Migracion historica fuera de alcance | Diferido | Levantar archivos fuente y reglas de limpieza en EPIC separado. |
| Selector temporal de rol | Controlado | Solo desarrollo con `VITE_ENABLE_TEMP_ROLE_SWITCHER=true`; deshabilitado en produccion por backend. |
| Consultas Firestore con filtro en memoria | Aceptado MVP | Migrar a queries/indexes antes de escalar volumen. |

## Proximo paso

Iniciar EPIC 5 con plan UAT, checklist de usuarios reales, validacion visual en ambiente desplegado, correcciones finales y decision de go-live.
