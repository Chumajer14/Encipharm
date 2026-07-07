# EVM - Consolidado de Cierre

## Resumen ejecutivo

El proyecto Enci Ventas cierra el alcance del MVP web con valor ganado equivalente al trabajo planificado. El alcance evaluado corresponde al CRM web, backend API, autenticacion, roles, flujo comercial, dashboards, readiness, QA y documentacion operativa.

## Consolidado

| Semana | Alcance | PV | EV | AC | SPI | CPI | Estado |
|--------|---------|----|----|----|-----|-----|--------|
| Semana 01 | Base tecnica y autenticacion | 10 | 10 | 10 | 1.0 | 1.0 | Cerrada |
| Semana 02 | Usuarios, CRM backend, CSV y dashboard base | 26 | 26 | 26 | 1.0 | 1.0 | Cerrada |
| Semana 03 | Interacciones, oportunidades y propuestas | 34 | 34 | 34 | 1.0 | 1.0 | Cerrada |
| Semana 04 | Hardening, QA y dashboards | 24 | 24 | 24 | 1.0 | 1.0 | Cerrada |
| Semana 05 | Readiness, cierre CRM web y documentacion | 36 | 36 | 36 | 1.0 | 1.0 | Cerrada |
| **Total** | **MVP web** | **130** | **130** | **130** | **1.0** | **1.0** | **Cerrado para Development** |

## Interpretacion

- `EV = PV`: el alcance web comprometido queda completado para Development.
- `AC = EV`: no se registra desviacion relativa en esfuerzo estimado.
- `SPI = 1.0`: no hay atraso respecto del cierre web consolidado.
- `CPI = 1.0`: no hay sobrecosto relativo en la medicion del MVP web.

## Criterios de cierre considerados

- Login Google SSO y sincronizacion de usuario.
- Roles `vendedor`, `supervisor`, `admin` y bloqueo de usuarios inactivos.
- CRUD de clientes con busqueda, filtros, paginacion y baja logica.
- Unicidad de email para clientes activos en alta/edicion manual.
- Importacion CSV admin con validaciones defensivas.
- Interacciones, oportunidades, propuestas y detalle comercial.
- Creacion/edicion web de oportunidades.
- Dashboard, proyecciones, forecast exportable y equipo de ventas.
- Readiness, smoke test, hardening, audit y build frontend.
- Documentacion de API, QA, setup, arquitectura y cierre.

## Condiciones para aceptacion final

El cierre tecnico no reemplaza UAT. Para aceptar la salida controlada se debe validar en ambiente objetivo:

- `GET /health`
- `GET /readiness`
- smoke test `tools/smoke_crm_web.py`
- login con usuario real autorizado
- flujos de vendedor, supervisor y admin
- reglas comerciales finales aprobadas por el cliente
