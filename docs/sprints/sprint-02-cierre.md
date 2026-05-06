# Sprint 02 - Cierre EPIC 2

**Fecha de corte:** 5 mayo 2026

**Rama:** `feature-epic-2-cierre-crm`

**Estado:** Cerrado funcionalmente para MVP web

## Objetivo

Cerrar EPIC 2: CRM, autenticacion, usuarios/roles, datos base, importacion CSV backend y dashboard vendedor/supervisor.

## Alcance cerrado

| Area | Resultado |
|------|-----------|
| Login y sesion | Frontend protegido por Firebase Auth y sincronizacion backend |
| CRM clientes | Listado real, busqueda, filtro por estado, creacion, detalle, edicion y eliminacion |
| Permisos | Vendedores limitados a clientes propios; supervisor/admin con acceso consolidado |
| Dashboard | Vista vendedor con metricas propias y vista supervisor/admin con metricas consolidadas |
| Importacion CSV | Backend mantiene validacion por fila y carga atomica si no hay errores |
| Documentacion | README y docs API actualizados |

## Cambios tecnicos principales

- Se agrego `DELETE /clientes/{cliente_id}`.
- Se agrego validacion de pertenencia para `GET`, `PATCH` y `DELETE /clientes/{cliente_id}` cuando el rol es `vendedor`.
- Se fuerza `vendedorUid` del usuario autenticado en altas y actualizaciones realizadas por vendedores.
- Se corrigio el consumo frontend del contrato real del dashboard.
- Se agrego `/clientes/:clienteId` para detalle y edicion.
- Se centralizaron validaciones de formulario en `frontend/src/utils/clienteForm.js`.

## Criterios de aceptacion

- Usuario no autenticado no accede a rutas protegidas.
- Vendedor ve y opera solo sus clientes.
- Supervisor/admin ve metricas consolidadas.
- CRM lista clientes reales y permite buscar por datos comerciales.
- Cliente puede crearse, editarse y eliminarse desde frontend.
- Formularios bloquean datos obligatorios vacios, email invalido y telefono chileno invalido.
- Documentacion refleja endpoints y flujo actualizado.

## Pendiente para EPIC 3

- Interacciones y visitas.
- Pipeline/Kanban de oportunidades.
- Propuestas basicas.
- Relacion cliente-oportunidad-propuesta.
