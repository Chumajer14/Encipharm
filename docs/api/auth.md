# API - Autenticacion

Base URL desarrollo: `http://127.0.0.1:8000`

Los endpoints protegidos requieren header:

```http
Authorization: Bearer <firebase_id_token>
```

## Errores estandar

Los errores HTTP se normalizan con el siguiente contrato JSON:

```json
{
  "error": "No tienes permisos para esta accion",
  "codigo": "ERR_FORBIDDEN",
  "detalles": null,
  "timestamp": "2026-05-15T12:00:00+00:00"
}
```

Codigos usados:

| HTTP | Codigo |
|------|--------|
| 400 | `ERR_BAD_REQUEST` |
| 401 | `ERR_UNAUTHORIZED` |
| 403 | `ERR_FORBIDDEN` |
| 404 | `ERR_NOT_FOUND` |
| 409 | `ERR_CONFLICT` |
| 413 | `ERR_PAYLOAD_TOO_LARGE` |
| 422 | `ERR_VALIDATION` |
| 429 | `ERR_RATE_LIMIT` |
| 500 | `ERR_INTERNAL` |
| 503 | `ERR_SERVICE_UNAVAILABLE` |

## POST `/auth/register`

Crea el perfil interno del usuario autenticado en Firestore o retorna el perfil existente.

**Autenticacion:** requerida.

**Body:** no recibe body. Los datos salen del token Firebase validado.

**Respuesta exitosa `200 OK`:**

```json
{
  "uid": "string",
  "email": "usuario@enci.cl",
  "nombre": "Juan Perez",
  "rol": "vendedor",
  "activo": true,
  "createdAt": "2026-04-24T12:00:00Z",
  "updatedAt": "2026-04-24T12:00:00Z"
}
```

Si el usuario no existe en Firestore, se crea con rol inicial `vendedor`.
Si el usuario existe con `activo = false`, la API rechaza el login y los endpoints protegidos con `403`.

## PATCH `/auth/temporary-role`

Cambia el rol de la propia cuenta autenticada para pruebas de interfaz y permisos.

**TEMPORAL - TEMPORAL:** este endpoint existe solo para validacion funcional durante desarrollo y debe eliminarse antes de entregar el sistema final. Esta deshabilitado por defecto y solo funciona cuando `APP_ENV=development` y `ENABLE_TEMPORARY_ROLE_SWITCHER=true`. En `production`, `staging`, `uat` o con el flag apagado responde `403`.

Controles aplicados:

- Solo cambia el rol del `uid` autenticado por el token Firebase.
- El body rechaza campos extra como `uid`, `email`, `activo`, `rango`, `ownerUid` o equivalentes.
- Registra evento `temporary_role_change` en `audit_logs`.
- `Settings` rechaza configuracion de produccion con `ENABLE_TEMPORARY_ROLE_SWITCHER=true`.

**Autenticacion:** requerida.

**Body:**

```json
{
  "rol": "admin"
}
```

Valores permitidos: `vendedor`, `supervisor`, `admin`.

**Respuesta exitosa `200 OK`:** retorna el `UserResponse` actualizado.

## GET `/me`

Retorna los datos basicos del usuario autenticado a partir del token JWT.

**Autenticacion:** requerida.

**Respuesta exitosa `200 OK`:**

```json
{
  "uid": "string",
  "email": "usuario@enci.cl",
  "rol": "vendedor",
  "activo": true,
  "message": "Token valido"
}
```

## GET `/health`

Verifica que el servidor este operativo.

**Autenticacion:** no requerida.

**Respuesta exitosa `200 OK`:**

```json
{
  "status": "ok"
}
```

## Modelos Pydantic

| Modelo | Uso |
|--------|-----|
| `UserBase` | Campos base del usuario |
| `UserCreate` | Representacion de creacion interna |
| `UserResponse` | Respuesta al cliente |

**Implementado en:** `app/models/user.py`

**Router en:** `app/api/auth.py`
