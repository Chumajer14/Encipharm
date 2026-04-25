# API — CRM Clientes

Base URL: `http://127.0.0.1:8000` (desarrollo) | `https://api.encipharm.cl/v1` (producción)

Todos los endpoints requieren header:
Authorization: Bearer <token_jwt>

---

## GET `/clientes/`

Lista todos los clientes. Si se pasa `vendedor_uid` filtra por vendedor.

**Autenticación:** ✅ Requerida

**Respuesta exitosa `200 OK`:**
```json
[
  {
    "id": "abc123",
    "nombre": "Farmacia Cruz Verde",
    "rut": "76.123.456-7",
    "email": "contacto@cruzverde.cl",
    "telefono": "+56912345678",
    "empresa": "Cruz Verde S.A.",
    "segmento": "cliente",
    "vendedor_uid": "uid_vendedor",
    "createdAt": "2026-04-25T00:00:00Z",
    "updatedAt": "2026-04-25T00:00:00Z"
  }
]
```

---

## POST `/clientes/`

Crea un nuevo cliente en Firestore.

**Autenticación:** ✅ Requerida

**Body (JSON):**
```json
{
  "nombre": "Farmacia Cruz Verde",
  "rut": "76.123.456-7",
  "email": "contacto@cruzverde.cl",
  "telefono": "+56912345678",
  "empresa": "Cruz Verde S.A.",
  "cargo": "Gerente de Compras",
  "region": "Metropolitana",
  "comuna": "Santiago",
  "direccion": "Av. Providencia 123",
  "segmento": "cliente",
  "notas": "Cliente frecuente",
  "vendedor_uid": "uid_vendedor"
}
```

**Respuesta exitosa `200 OK`:** mismo objeto con `id`, `createdAt`, `updatedAt`.

---

## GET `/clientes/{cliente_id}`

Obtiene el detalle de un cliente por ID.

**Autenticación:** ✅ Requerida

**Respuesta exitosa `200 OK`:** objeto cliente completo.

**Error `404`:**
```json
{ "detail": "Cliente no encontrado" }
```

---

## PUT `/clientes/{cliente_id}`

Actualiza campos de un cliente existente. Solo se actualizan los campos enviados.

**Autenticación:** ✅ Requerida

**Body (JSON):** cualquier campo de `ClienteUpdate` (todos opcionales):
```json
{
  "telefono": "+56998765432",
  "segmento": "prospecto"
}
```

---

## DELETE `/clientes/{cliente_id}`

Elimina un cliente de Firestore.

**Autenticación:** ✅ Requerida

**Respuesta exitosa `200 OK`:**
```json
{ "message": "Cliente eliminado correctamente" }
```

---

## Modelos Pydantic

| Modelo | Uso |
|--------|-----|
| `ClienteBase` | Campos base del cliente |
| `ClienteCreate` | Creación (incluye `vendedor_uid`) |
| `ClienteUpdate` | Actualización parcial (todos opcionales) |
| `ClienteResponse` | Respuesta al cliente con `id` y timestamps |

**Implementado en:** `app/models/cliente.py`  
**Servicio en:** `app/services/clientes.py`  
**Router en:** `app/api/clientes.py`