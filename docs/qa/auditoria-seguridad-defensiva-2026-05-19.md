# Auditoria de Seguridad Defensiva - Enci / Enci Ventas

Fecha: 2026-05-19  
Alcance: frontend React/Vite/Firebase Auth, backend FastAPI/Firebase Admin/Firestore, reglas Firebase, configuracion y pruebas automatizadas.  
Estado: MVP avanzado previo a UAT/go-live.

## Resumen ejecutivo

El sistema tiene una base de seguridad razonable para MVP: autenticacion centralizada con Firebase ID Token, autorizacion backend por rol, bloqueo de usuarios inactivos, Firestore rules deny-all para cliente directo, rate limit, limite de payload y controles BOLA principales en clientes y flujo comercial.

Durante esta auditoria se endurecieron controles de produccion, validacion estricta de payloads, proteccion contra mass assignment, exposicion de docs/OpenAPI, errores de validacion, CORS/headers, auditoria del endpoint temporal `/auth/temporary-role` y manejo frontend de errores API.

Resultado de validacion:

- Backend: `uv run pytest` -> 65 passed.
- Frontend: `npm.cmd run lint` -> OK.
- Frontend: `npm.cmd run build` -> OK.

## Arquitectura de seguridad actual

- Identidad: Google SSO mediante Firebase Auth.
- Sesion frontend: el ID token se mantiene en estado React; no se persiste en `localStorage`.
- Backend: FastAPI valida `Authorization: Bearer <firebase_id_token>` con Firebase Admin.
- Perfil interno: backend consulta `users/{uid}` en Firestore para `rol`, `activo`, `nombre` y preferencias.
- Autorizacion:
  - `require_role("vendedor")`: vendedor, supervisor, admin.
  - `require_role("supervisor")`: supervisor, admin.
  - `require_role("admin")`: admin.
- Propiedad:
  - Vendedor solo ve/escribe registros con su `uid`.
  - Supervisor puede consultar datos agregados y aprobar propuestas.
  - Admin puede administrar usuarios y ver datos globales.
- Firestore cliente: `firestore.rules` deniega todo `read/write`.
- Auditoria: `audit_logs` para cambios criticos y ahora tambien para cambios temporales de rol.

## Superficie de ataque identificada

### Endpoints API

Publicos:

- `GET /`
- `GET /health`
- `GET /readiness`
- `GET /docs` solo no-produccion
- `GET /docs/guia-presentacion-frontend.pdf` solo no-produccion
- `GET /openapi.json` solo no-produccion

Autenticados:

- `POST /auth/login`
- `POST /auth/register`
- `GET /me`
- `GET /clientes`
- `GET /clientes/{cliente_id}`
- `POST /clientes`
- `PATCH /clientes/{cliente_id}`
- `DELETE /clientes/{cliente_id}`
- `GET /interacciones`
- `POST /interacciones`
- `GET /oportunidades`
- `GET /oportunidades/{oportunidad_id}/detalle`
- `POST /oportunidades`
- `PATCH /oportunidades/{oportunidad_id}`
- `GET /propuestas`
- `POST /propuestas`
- `PATCH /propuestas/{propuesta_id}`
- `GET /dashboard/vendedor`
- `PATCH /users/me/preferences`

Supervisor/admin:

- `GET /dashboard/supervisor`
- `GET /users`
- `GET /users/{uid}`

Admin:

- `POST /clientes/import-csv`
- `PATCH /users/{uid}`
- `PATCH /users/{uid}/role`
- `PATCH /users/{uid}/status`

Temporal de desarrollo:

- `PATCH /auth/temporary-role`

### Middlewares y controles transversales

- `InMemoryRateLimitMiddleware`: limite por IP y ventana de 60 segundos.
- `RequestSizeLimitMiddleware`: limite de 1 MB por request.
- CORS restringido a origenes configurados.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`.
- Handlers de error estandarizados.

### Puntos de entrada de datos

- Formularios de clientes.
- Importacion CSV de clientes.
- Interacciones comerciales.
- Oportunidades.
- Propuestas.
- Administracion de usuarios.
- Preferencias de usuario (`theme`, `language`).
- Query params: busqueda, filtros, ids, estado, etapa, limite.

### Rutas frontend

- `/login`
- `/dashboard`
- `/clientes`
- `/clientes/:clienteId`
- `/crear`
- `/interacciones`
- `/oportunidades`
- `/oportunidades/:oportunidadId`
- `/propuestas`
- `/proyecciones`
- `/equipo`
- `/inteligencia`
- `/competencia`
- `/configuracion`

## Hallazgos confirmados

### Alta - Payloads extra eran ignorados silenciosamente por Pydantic

Que lo causa:

Pydantic por defecto puede ignorar campos extra si el modelo no define `extra="forbid"`. Esto permite que intentos de mass assignment parezcan exitosos o pasen desapercibidos.

Explotacion controlada:

Un usuario autenticado envia campos como `uid`, `email`, `activo`, `vendedorUid`, `montoTotal` o `createdAt` junto al body permitido. Aunque varios servicios recalculaban campos sensibles, el rechazo explicito no existia en todos los modelos.

Archivos afectados:

- `Backend/app/models/cliente.py`
- `Backend/app/models/comercial.py`
- `Backend/app/models/user.py`

Correccion:

Se agrego `ConfigDict(extra="forbid")` a modelos de entrada: create/update de clientes, comercial y usuarios.

Tests:

- `test_cliente_rejects_unexpected_sensitive_fields`
- `test_user_update_rejects_unknown_sensitive_fields`
- `test_commercial_models_reject_mass_assignment_fields`
- `test_temporary_role_rejects_extra_uid_email_and_status_fields`

### Alta - Endpoint temporal de rol necesitaba controles explicitos de entorno y auditoria

Que lo causa:

`PATCH /auth/temporary-role` es funcionalmente peligroso porque permite cambiar rol durante pruebas. Ya estaba bloqueado en `production`, pero no tenia feature flag, auditoria explicita ni rechazo probado de campos extra.

Explotacion controlada:

Una cuenta autenticada intenta enviar `rol=admin` o agregar `uid`/`email`/`activo` para modificar otra cuenta o campos sensibles.

Archivos afectados:

- `Backend/app/api/auth.py`
- `Backend/app/core/config.py`
- `Backend/app/models/user.py`
- `docs/api/auth.md`

Correccion:

- Solo funciona si `APP_ENV=development` y `ENABLE_TEMPORARY_ROLE_SWITCHER=true`.
- En `production`, `staging`, `uat` o flag apagado responde `403`.
- El body rechaza campos extra.
- Solo actualiza `user["uid"]` del token autenticado.
- Registra `temporary_role_change` en `audit_logs`.
- `Settings` rechaza produccion con `ENABLE_TEMPORARY_ROLE_SWITCHER=true`.
- Documentado como control temporal pendiente de retiro.

Tests:

- `test_temporary_role_updates_current_user`
- `test_temporary_role_is_disabled_in_production`
- `test_temporary_role_is_disabled_when_feature_flag_off`
- `test_temporary_role_rejects_extra_uid_email_and_status_fields`
- `test_production_rejects_enabled_temporary_role_switcher`

Estado:

Riesgo aceptado temporalmente para desarrollo. Debe retirarse antes de produccion.

### Media - Docs/OpenAPI custom podian quedar disponibles en produccion

Que lo causa:

FastAPI tenia `docs_url=None`, pero `openapi_url` seguia activo por defecto y el router custom `/docs` no bloqueaba `APP_ENV=production`.

Explotacion controlada:

En produccion, un usuario no autenticado podria acceder a inventario de endpoints o a consola de pruebas si el backend estuviera publicado sin restriccion.

Archivos afectados:

- `Backend/app/main.py`
- `Backend/app/docs.py`

Correccion:

- `openapi_url=None` cuando `APP_ENV=production`.
- `/docs` y PDF custom responden `404` en produccion.
- CSP especifica para docs no-produccion.

Tests:

- `test_custom_docs_are_blocked_in_production`

### Media - Errores 422 podian incluir valores de entrada

Que lo causa:

El handler de validacion exponia `exc.errors()` completo, que puede incluir `input`.

Explotacion controlada:

Un payload invalido con token, correo sensible o texto confidencial podria reflejarse en respuesta de error.

Archivos afectados:

- `Backend/app/core/errors.py`

Correccion:

Se sanitizan detalles de validacion para retornar solo `loc`, `msg` y `type`.

Tests:

- `test_validation_errors_do_not_echo_rejected_input`

### Media - Healthcheck exponia ambiente

Que lo causa:

`GET /health` retornaba `env`.

Explotacion controlada:

Un usuario no autenticado podria inferir entorno y adaptar ataques o enumeracion.

Archivos afectados:

- `Backend/app/main.py`
- `docs/api/auth.md`

Correccion:

`/health` retorna solo `{"status":"ok"}`.

Tests:

Validado indirectamente por suite y documentacion actualizada.

### Media - CORS y headers eran correctos pero mejorables para produccion

Que lo causa:

CORS usaba metodos y headers comodin. Faltaban `Permissions-Policy` y CSP basica para API.

Explotacion controlada:

Mayor superficie ante clientes web mal configurados o integraciones no esperadas.

Archivos afectados:

- `Backend/app/main.py`
- `Backend/app/core/config.py`

Correccion:

- Metodos CORS restringidos a `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`.
- Headers CORS restringidos a `Authorization`, `Content-Type`.
- Agregados `Permissions-Policy` y CSP.
- Validacion ya existente impide `*` y regex abierta en produccion.

Tests:

- `test_production_rejects_wildcard_cors`
- `test_production_rejects_open_cors_regex`

### Media - Supervisor podia enviar cambios de asignacion de cliente

Que lo causa:

`ClienteUpdate` admitia `vendedorUid`/`ownerUid`; vendedor era forzado a su UID, pero supervisor podia pasar cambios al servicio si llamaba endpoint manualmente.

Explotacion controlada:

Supervisor intenta reasignar propiedad de cliente por `PATCH /clientes/{id}`.

Archivos afectados:

- `Backend/app/api/clientes.py`

Correccion:

Solo admin puede cambiar `vendedorUid`/`ownerUid`; para vendedor/supervisor se remueven del `changes` antes de actualizar.

Tests:

Cubierto por mass-assignment/propiedad y controles existentes de clientes.

## Hallazgos potenciales mitigados preventivamente

### Baja - Frontend no entendia contrato estandar `{error,codigo}`

Correccion:

`frontend/src/services/api.js` ahora lee `errorBody.error` ademas de `detail`, evitando mensajes genericos y reduciendo debugging inseguro en UI.

### Baja - Cache temporal frontend podria confundirse con token storage

Observacion:

La cache `useCachedQuery` usa `sessionStorage`, pero solo para datos de negocio, no tokens. Los ID tokens siguen en memoria React.

Mitigacion:

Se mantiene separacion entre cache de datos y credenciales. La cache se revalida en foco/cada 30 segundos y se invalida tras mutaciones criticas.

## Riesgos residuales

- `PATCH /auth/temporary-role` sigue existiendo como riesgo aceptado temporalmente de desarrollo. Debe eliminarse antes de go-live.
- Las consultas Firestore en servicios listan colecciones y filtran en memoria. No filtran en cliente, pero conviene migrar a queries por `vendedorUid`, `clienteId`, `estado`, `etapa` para menor exposicion operativa y costo.
- No se ejecuto una prueba E2E real con Playwright autenticado contra Firebase en esta pasada; queda como actividad UAT.
- No hay evidencia automatica de que `firestore.rules` ya este desplegado en Firebase; el archivo local es deny-all y `firebase.json` lo referencia.
- La consola `/docs` no-produccion guarda token en `sessionStorage`; aceptable para testing, pero no debe exponerse en entornos publicos.
- Rate limit es in-memory por proceso. En despliegue multi-instancia debe migrarse a Redis/servicio compartido.

## Cambios de codigo realizados

- `Backend/app/core/config.py`: flag `ENABLE_TEMPORARY_ROLE_SWITCHER`, validacion de produccion.
- `Backend/app/main.py`: OpenAPI off en produccion, CORS limitado, headers de seguridad, health sin ambiente.
- `Backend/app/docs.py`: bloqueo de docs custom en produccion.
- `Backend/app/core/errors.py`: errores 422 sin eco de input.
- `Backend/app/models/cliente.py`: `extra="forbid"` para payloads.
- `Backend/app/models/comercial.py`: `extra="forbid"` para payloads.
- `Backend/app/models/user.py`: `extra="forbid"` para payloads de usuario/rol/preferencias.
- `Backend/app/api/auth.py`: temporal role switcher bloqueado fuera de development/flag y auditado.
- `Backend/app/api/clientes.py`: solo admin puede reasignar `vendedorUid`/`ownerUid`.
- `frontend/src/services/api.js`: lectura correcta del contrato de error estandar.
- `docs/api/auth.md`: documentacion actualizada de health y endpoint temporal.

## Tests agregados

- Configuracion de produccion rechaza temp role switcher habilitado.
- Docs custom bloqueados en produccion.
- Errores de validacion no reflejan input sensible.
- Cliente rechaza campos extra/sensibles.
- Usuario update rechaza `uid`/`email` extra.
- Comercial rechaza mass assignment de `vendedorUid`, `montoTotal`, `createdAt`.
- Temporary role:
  - permitido en development;
  - bloqueado en production;
  - bloqueado por feature flag apagado;
  - rechaza campos extra;
  - persiste solo el rol propio;
  - registra auditoria.

## Casos de abuso cubiertos

- Vendedor accede a cliente ajeno: `403`.
- Vendedor crea interaccion en cliente ajeno: `403`.
- Vendedor vincula propuesta a oportunidad ajena: `403`.
- Propuesta contra oportunidad de otro cliente: `400`.
- Supervisor crea propuesta: `403`.
- Supervisor intenta editar campos no permitidos de propuesta: `403`.
- Usuario inactivo intenta login o endpoint protegido: `403`.
- Payload CSV con formulas, duplicados, encoding invalido, oversize o exceso de filas: rechazado.
- Payloads con campos extra/sensibles: `422`.
- Docs custom en produccion: `404`.
- CORS abierto en produccion: falla configuracion.

## Recomendaciones de hardening futuro

- Retirar `PATCH /auth/temporary-role` antes de produccion.
- Migrar rate limit a almacenamiento compartido si hay mas de una instancia.
- Convertir listados Firestore a queries filtradas por propiedad e indices compuestos.
- Agregar pruebas E2E Playwright autenticadas con Firebase emulator o mocks.
- Agregar CI que ejecute `uv run pytest`, `npm run lint`, `npm run build` en cada PR.
- Verificar despliegue real de `firestore.rules` con `firebase deploy --only firestore:rules` y evidencia de release.
- Agregar versionado de reglas y checklist de IAM para service account.
- Evaluar token revocation check (`check_revoked=True`) si el costo/latencia es aceptable.
- Agregar alertas sobre eventos `temporary_role_change`, cambios de rol, desactivaciones y CSV import.

## Checklist pre-UAT / pre-produccion

- [ ] `APP_ENV=uat` o `production` configurado correctamente.
- [ ] `ENABLE_TEMPORARY_ROLE_SWITCHER=false` en cualquier ambiente desplegado.
- [ ] `/auth/temporary-role` eliminado o inaccesible antes de go-live.
- [ ] `/openapi.json` no disponible en produccion.
- [ ] `/docs` responde `404` en produccion.
- [ ] `CORS_ORIGINS` solo contiene dominios HTTPS esperados.
- [ ] `firestore.rules` deny-all desplegado y verificado.
- [ ] Service account fuera del repo y con permisos minimos.
- [ ] Suite backend completa pasando.
- [ ] Build/lint frontend pasando.
- [ ] Pruebas UAT con vendedor, supervisor, admin e inactivo.
- [ ] Pruebas BOLA con IDs manipulados en clientes, oportunidades y propuestas.
- [ ] Pruebas CSV malicioso y duplicados.
- [ ] Revision de audit logs para cambios criticos.
- [ ] Monitoreo y backups Firestore habilitados.
