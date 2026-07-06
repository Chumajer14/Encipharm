# Sprint 02.1 - Avance EPIC 2: CRM, Usuarios y Datos Base

## Estado de cierre

Este documento queda como bitacora historica del avance intermedio del EPIC 2. Las brechas registradas en ese momento fueron cerradas dentro del alcance del MVP web y quedan consolidadas en `docs/sprints/sprint-02-cierre.md`, `docs/sprints/sprint-05.md`, `docs/cierre-proyecto.md` y `docs/evm/cierre-proyecto.md`.

## Estado del proyecto en el avance

Durante este avance se continuo trabajando en el EPIC 2, enfocado en autenticacion, navegacion protegida, dashboard y gestion base de clientes.

El sistema contaba con:

- Login con Google mediante Firebase Authentication.
- Conexion del frontend con el backend FastAPI.
- Validacion de sesion mediante token Firebase.
- Rutas protegidas para evitar acceso sin autenticacion.
- Dashboard base implementado.
- Vista CRM Clientes conectada al backend.
- Creacion de clientes desde formulario.
- Listado de clientes reales desde la API.
- Busqueda y filtrado de clientes por nombre, empresa, rubro o region.
- Navegacion entre Dashboard, Clientes y Nuevo Cliente.
- Boton de retorno desde CRM Clientes hacia Dashboard.
- Ajustes visuales en botones, encabezados y flujo de navegacion.

## Cambios realizados

### Frontend

Se modificaron los siguientes archivos:

- `frontend/src/App.jsx`
- `frontend/src/App.css`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/Clientes.jsx`
- `frontend/src/pages/CrearCliente.jsx`
- `frontend/src/services/api.js`
- `frontend/src/services/clientesService.js`

### Funcionalidades agregadas

- Ruta principal `/` redirigiendo al login.
- Ruta `/dashboard`.
- Navegacion protegida para clientes, dashboard y creacion de clientes.
- Pantalla base del dashboard.
- Boton "Volver al Dashboard" en la vista CRM Clientes.
- Correcciones de conexion entre frontend y backend.

## Problemas encontrados y solucionados

- Pantalla en blanco por falta de ruta `/` en `App.jsx`.
- Error de conexion por diferencia entre puertos `8000` y `8001`.
- Error al iniciar backend usando `uvicorn main:app`, corregido usando `uvicorn app.main:app`.
- Conflictos de Git en `Clientes.jsx` y `clientesService.js`.
- Problemas de CORS y configuracion de URL del backend.
- Riesgo de subir archivos sensibles al repositorio.

## Soluciones aplicadas

- Redireccion desde `/` hacia `/login`.
- Correccion de URL de API en frontend.
- Uso de variables de entorno para no exponer datos sensibles.
- Proteccion de `.env` y `serviceAccountKey.json` mediante `.gitignore`.
- Resolucion manual de conflictos.

## Seguridad

Se mantiene la restriccion de no subir archivos sensibles al repositorio:

- `Backend/.env`
- `frontend/.env`
- `Backend/serviceAccountKey.json`
- Cualquier archivo con credenciales privadas o service account.

## Validaciones cerradas en consolidado

- Validaciones de formularios de clientes.
- Mensajes claros de error y exito.
- Edicion y eliminacion logica de clientes.
- Dashboard diferenciado por rol.
- Datos del usuario autenticado.
- Cierre de sesion visible.
- Revision de permisos por rol.

## Estado general

El EPIC 2 queda cerrado para el MVP web. El avance intermedio se conserva solo como trazabilidad del proceso.
