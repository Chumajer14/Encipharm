# API - Usuarios y roles

Base URL desarrollo: `http://127.0.0.1:8000`

Todos los endpoints requieren:

```http
Authorization: Bearer <firebase_id_token>
```

## Roles

| Rol | Alcance |
|-----|---------|
| `admin` | Puede listar, consultar y modificar usuarios, roles y estado |
| `supervisor` | Puede listar y consultar usuarios |
| `vendedor` | No puede administrar usuarios |

## GET `/users/`

Lista usuarios. Disponible para `admin` y `supervisor`.

Query params:

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `activo` | boolean opcional | Filtra usuarios activos o inactivos |
| `limit` | entero opcional, 1-500 | Limita usuarios retornados; default 100 |

## GET `/users/{uid}`

Retorna un usuario por UID. Disponible para `admin` y `supervisor`.

## PATCH `/users/{uid}`

Actualiza datos administrativos de un usuario. Requiere `admin`.

Body parcial:

```json
{
  "nombre": "Juan Perez",
  "rol": "supervisor",
  "activo": true
}
```

## PATCH `/users/{uid}/role`

Actualiza solo el rol de un usuario. Requiere `admin`.

```json
{
  "rol": "supervisor"
}
```

## PATCH `/users/{uid}/status`

Activa o desactiva un usuario. Requiere `admin`.

```json
{
  "activo": false
}
```

## Respuesta `UserResponse`

```json
{
  "uid": "seller-1",
  "email": "seller@enci.cl",
  "nombre": "Vendedor",
  "rol": "vendedor",
  "activo": true,
  "createdAt": "2026-05-02T12:00:00Z",
  "updatedAt": "2026-05-02T12:00:00Z"
}
```

## Archivos relacionados

- `Backend/app/api/users.py`
- `Backend/app/models/user.py`
- `Backend/app/services/users.py`
- `Backend/app/core/auth.py`
