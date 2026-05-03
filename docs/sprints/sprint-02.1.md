# Sprint 02.1 — Avance EPIC 2: CRM, Usuarios y Datos Base

## Estado del proyecto

Durante este avance se continuó trabajando en el EPIC 2, enfocado en autenticación, navegación protegida, dashboard y gestión base de clientes.

Actualmente el sistema cuenta con:

- Login con Google mediante Firebase Authentication.
- Conexión del frontend con el backend FastAPI.
- Validación de sesión mediante token Firebase.
- Rutas protegidas para evitar acceso sin autenticación.
- Dashboard base implementado.
- Vista CRM Clientes conectada al backend.
- Creación de clientes desde formulario.
- Listado de clientes reales desde la API.
- Búsqueda y filtrado de clientes por nombre, empresa, rubro o región.
- Navegación entre Dashboard, Clientes y Nuevo Cliente.
- Botón de retorno desde CRM Clientes hacia Dashboard.
- Ajustes visuales en botones, encabezados y flujo de navegación.

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

- Se agregó la ruta principal `/` redirigiendo al login.
- Se incorporó la ruta `/dashboard`.
- Se agregó navegación protegida para clientes, dashboard y creación de clientes.
- Se creó la pantalla base del dashboard.
- Se agregó botón “Volver al Dashboard” en la vista CRM Clientes.
- Se corrigieron problemas de conexión entre frontend y backend.

## Problemas encontrados Y SOLUCIONADOS

Durante el desarrollo se presentaron algunos problemas técnicos:

- Pantalla en blanco por falta de ruta `/` en `App.jsx`.
- Error de conexión por diferencia entre puertos `8000` y `8001`.
- Error al iniciar backend usando `uvicorn main:app`, corregido usando `uvicorn app.main:app`.
- Conflictos de Git en `Clientes.jsx` y `clientesService.js`.
- Problemas de CORS y configuración de URL del backend.
- Riesgo de subir archivos sensibles al repositorio.

## Soluciones aplicadas

- Se agregó redirección desde `/` hacia `/login`.
- Se corrigió la URL de la API en el frontend.
- Se mantuvo el uso de variables de entorno para no exponer datos sensibles.
- Se validó que no se subieran archivos `.env` ni `serviceAccountKey.json`.
- Se resolvieron conflictos manualmente eliminando marcas como `<<<<<<< HEAD`.
- Se continuó el rebase con `git rebase --continue`.

## Seguridad

Se mantiene la restricción de no subir archivos sensibles al repositorio:

- `Backend/.env`
- `frontend/.env`
- `Backend/serviceAccountKey.json`
- Cualquier archivo con credenciales privadas o service account.

Estos archivos deben mantenerse localmente y estar protegidos mediante `.gitignore`.

## Mejoras pendientes

Para mejorar la calidad del sistema, se propone implementar validaciones en formularios:

- No permitir campos vacíos al crear cliente.
- Validar que nombre, empresa y rubro no contengan caracteres inválidos.
- Validar formato de correo electrónico.
- Validar número telefónico si se agrega ese campo.
- Mostrar mensajes claros cuando el usuario ingrese datos incorrectos.
- Evitar que se envíe el formulario si los datos no cumplen las reglas.
- Agregar confirmación visual cuando un cliente se cree correctamente.


## PROXIMAS MEJORAS

Los próximos pasos dentro del EPIC 2 son:

Completar la gestión de clientes.
Agregar vista de detalle de cliente.
Implementar edición de clientes.
Implementar eliminación de clientes.
Mejorar validaciones del formulario.
Mejorar mensajes de error y éxito.
Diferenciar dashboard de vendedor y supervisor.
Mostrar datos del usuario autenticado.
Implementar cierre de sesión visible desde el dashboard.
Revisar permisos según rol de usuario.
Preparar base para iniciar EPIC 3.
Estado general

## ESTADO GENERAL

El EPIC 2 se encuentra en avance funcional.
El sistema ya permite autenticación, navegación principal y gestión inicial de clientes reales conectados al backend.
Aún faltan validaciones, edición, eliminación, permisos por rol y mejoras visuales para cerrar completamente este EPIC.