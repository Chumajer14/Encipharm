# API - Autenticacion

Base URL desarrollo: `http://127.0.0.1:8000`

Los endpoints protegidos requieren header:

```http
Authorization: Bearer <firebase_id_token>
```

## POST `/auth/register`

Crea el perfil interno del usuario autenticado en Firestore o retorna el perfil existente.

**Autenticacion:** requerida.

**Body:** no recibe body. Los datos salen del token Firebase validado.

**Respuesta exitosa `200 OK`:**

```json
{
  "uid": "string",
  "email": "usuario@encipharm.cl",
  "nombre": "Juan Perez",
  "rol": "vendedor",
  "activo": true,
  "createdAt": "2026-04-24T12:00:00Z",
  "updatedAt": "2026-04-24T12:00:00Z"
}
```

Si el usuario no existe en Firestore, se crea con rol inicial `vendedor`.

## GET `/me`

Retorna los datos basicos del usuario autenticado a partir del token JWT.

**Autenticacion:** requerida.

**Respuesta exitosa `200 OK`:**

```json
{
  "uid": "string",
  "email": "usuario@encipharm.cl",
  "message": "Token valido"
}
```

## GET `/health`

Verifica que el servidor este operativo.

**Autenticacion:** no requerida.

**Respuesta exitosa `200 OK`:**

```json
{
  "status": "ok",
  "env": "development"
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
