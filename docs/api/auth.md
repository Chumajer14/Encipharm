# API — Autenticación

Base URL: `http://127.0.0.1:8000` (desarrollo) | `https://api.encipharm.cl/v1` (producción)

Todos los endpoints protegidos requieren header:

Authorization: Bearer <token_jwt>


---

## POST `/auth/register`

Registra un nuevo usuario en Firebase Auth y guarda su perfil en Firestore.

**Autenticación:** No requerida

**Body (JSON):**
```json
{
  "uid": "string",
  "email": "usuario@encipharm.cl",
  "nombre": "Juan Pérez",
  "rol": "vendedor",
  "activo": true
}
```

**Respuesta exitosa `200 OK`:**
```json
{
  "uid": "string",
  "email": "usuario@encipharm.cl",
  "nombre": "Juan Pérez",
  "rol": "vendedor",
  "activo": true
}
```

---

## GET `/me`

Retorna los datos del usuario autenticado a partir del token JWT.

**Autenticación:** ✅ Requerida

**Respuesta exitosa `200 OK`:**
```json
{
  "uid": "string",
  "email": "usuario@encipharm.cl",
  "message": "Token válido ✅"
}
```

---

## GET `/health`

Verifica que el servidor esté operativo.

**Autenticación:** No requerida

**Respuesta exitosa `200 OK`:**
```json
{
  "status": "ok",
  "env": "development"
}
```

---

## Modelos Pydantic

| Modelo | Uso |
|--------|-----|
| `UserBase` | Campos base del usuario |
| `UserCreate` | Registro (incluye `uid`) |
| `UserResponse` | Respuesta al cliente |

**Implementado en:** `app/models/user.py`  
**Router en:** `app/api/auth.py`