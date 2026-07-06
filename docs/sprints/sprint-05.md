# Sprint 05 - EPIC 5: UAT, documentacion y go-live

**Fecha de inicio:** 17 mayo 2026  
**Fecha de cierre:** 10 julio 2026  
**Rama de cierre:** `cierre-proyecto`  
**Estado:** Cerrado para Development

## Objetivo

Preparar el MVP web para UAT y salida controlada, cerrando criterios operativos de backend, frontend CRM, documentacion de validacion, checklist de ambiente y evidencia de go-live.

## Alcance cerrado

| Ticket | Descripcion | Area | Estado |
|--------|-------------|------|--------|
| EV-050 | Checklist UAT funcional por rol | QA | Completado |
| EV-051 | Readiness backend para ambiente UAT/go-live | Backend | Completado |
| EV-052 | Runbook operativo de go-live y rollback | Docs | Completado |
| EV-053 | Smoke test posterior a despliegue | QA | Completado |
| EV-054 | Matriz de defectos UAT y criterios de aceptacion final | QA | Completado |
| EV-055 | Paginacion visual de clientes | Frontend | Completado |
| EV-056 | Creacion y edicion web de oportunidades | Frontend | Completado |
| EV-057 | Unicidad de email en alta/edicion manual de clientes | Backend | Completado |
| EV-058 | Cierre de vulnerabilidades frontend | Frontend | Completado |
| EV-059 | Code splitting frontend sin warning de bundle grande | Frontend | Completado |
| EV-060 | Documentacion de cierre y EVM consolidado | Docs | Completado |

## Fuera del cierre web

- Migracion historica de datos sin fuente aprobada.
- Integraciones externas nuevas.
- Calendario operativo, notificaciones push, OCR, firma digital, SAP/ERP y BI extendido.
- Automatizacion completa de login con navegador real; el smoke test cubre ambiente publicado y endpoints autenticados cuando existe token real.

## Criterios de aceptacion

- `/health` responde `status=ok` en el ambiente objetivo.
- `/readiness` responde `ready` antes de abrir UAT o go-live.
- `ENABLE_TEMPORARY_ROLE_SWITCHER=false` en ambientes desplegados.
- Firebase Auth valida login real en el ambiente objetivo.
- CORS contiene solo dominios autorizados para el ambiente desplegado.
- Roles `vendedor`, `supervisor` y `admin` completan los flujos UAT definidos.
- El CRM web permite busqueda, filtros, paginacion, alta y edicion de clientes y oportunidades.
- Defectos UAT quedan clasificados por severidad y con decision de salida.
- Documentacion de rollback, smoke test y cierre queda disponible antes de produccion.

## QA ejecutado

```bash
cd frontend
npm.cmd audit --audit-level=low
npm.cmd run lint
npm.cmd run build
```

```bash
python -m pytest Backend\tests\test_clientes_permissions.py Backend\tests\test_readiness.py Backend\tests\test_security_hardening.py
python -m py_compile tools\smoke_crm_web.py
```

Resultados:

- Audit frontend: 0 vulnerabilidades.
- Lint frontend: OK.
- Build frontend: OK.
- Backend tests relevantes: 58 passed.
- Smoke script: sintaxis OK.

## Documentacion

- `docs/cierre-proyecto.md`: resumen formal de cierre.
- `docs/evm/cierre-proyecto.md`: consolidado EVM.
- `docs/evm/semana-05.md`: corte EVM de cierre.
- `docs/qa/epic-05-uat-go-live.md`: checklist UAT, readiness, smoke test y go-live.
- `tools/smoke_crm_web.py`: smoke test operativo.

## Cierre

EPIC 5 queda cerrado para Development. El proyecto puede pasar a validacion UAT en ambiente objetivo con smoke test, readiness y criterios de salida documentados.
