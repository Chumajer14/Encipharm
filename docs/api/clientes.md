# API - Clientes e importacion CSV

Base URL desarrollo: `http://127.0.0.1:8000`

Todos los endpoints requieren:

```http
Authorization: Bearer <firebase_id_token>
```

## Permisos

| Endpoint | Roles |
|----------|-------|
| `GET /clientes/` | `admin`, `supervisor`, `vendedor` |
| `GET /clientes/{cliente_id}` | `admin`, `supervisor`, `vendedor` |
| `POST /clientes/` | `admin`, `supervisor`, `vendedor` |
| `PATCH /clientes/{cliente_id}` | `admin`, `supervisor`, `vendedor` |
| `DELETE /clientes/{cliente_id}` | `admin`, `supervisor`, `vendedor` |
| `POST /clientes/import-csv` | `admin` |

Los vendedores solo listan, consultan, modifican y eliminan clientes asignados a su `vendedorUid` u `ownerUid`.
Supervisores y administradores pueden operar sobre todos los clientes y filtrar por `vendedorUid`.
La importacion masiva queda restringida a `admin`, alineada a la matriz funcional del cliente.

## GET `/clientes/`

Lista clientes con filtros simples para el CRM.

Query params:

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `search` | string opcional, max 80 | Busca por nombre, empresa, email, rubro o region |
| `estado` | string opcional, max 32 | Filtra por estado |
| `vendedorUid` | string opcional, max 128 | Filtra por vendedor; se ignora para rol vendedor |
| `limit` | entero opcional, 1-500 | Limita la cantidad de clientes retornados; default 100 |

## POST `/clientes/`

Crea un cliente.

```json
{
  "nombre": "Maria Soto",
  "empresa": "Granja Los Pinos",
  "email": "maria@lospinos.cl",
  "telefono": "+56911111111",
  "rubro": "Cerdos",
  "region": "Maule",
  "estado": "En proceso"
}
```

Si no se envia `vendedorUid`, el backend asigna el UID del usuario autenticado.

Validaciones defensivas:

- `nombre`: 1-120 caracteres.
- `empresa`: 1-160 caracteres.
- `telefono`: max 32 caracteres.
- `rubro`: max 120 caracteres.
- `region`: max 80 caracteres.
- `estado`: solo `En proceso`, `Completado` o `Inactivo`.
- Campos de texto no pueden iniciar con `=`, `+`, `-` o `@` para evitar formula injection en futuras exportaciones.
- `email`: debe ser unico entre clientes activos; si ya existe, la API responde `409`.

## PATCH `/clientes/{cliente_id}`

Actualiza parcialmente un cliente.

```json
{
  "estado": "Completado",
  "region": "Biobio"
}
```

Si el usuario autenticado tiene rol `vendedor`, el backend fuerza `vendedorUid` y `ownerUid` al UID autenticado para evitar reasignaciones manuales.

Si se actualiza `email`, el nuevo correo debe ser unico entre clientes activos. Mantener el mismo email del cliente actual esta permitido.

## DELETE `/clientes/{cliente_id}`

Realiza una baja logica de un cliente existente. Retorna `204 No Content` cuando la eliminacion es exitosa.

Reglas:

- `vendedor`: solo puede dar de baja clientes propios.
- `supervisor` y `admin`: pueden dar de baja cualquier cliente.
- El registro queda marcado con `deletedAt` y `estado = Inactivo` para evitar perdida irreversible.
- Los listados y consultas directas ya no retornan clientes con `deletedAt`.
- Si el cliente no existe, retorna `404`.
- Si el vendedor intenta operar sobre un cliente ajeno, retorna `403`.

## POST `/clientes/import-csv`

Importa clientes desde un archivo CSV. Requiere `multipart/form-data` con campo `file` y rol `admin`.

Columnas soportadas:

```text
nombre,empresa,email,telefono,rubro,region,estado,vendedorUid
```

Columnas obligatorias:

- `nombre`
- `empresa`
- `email`

Comportamiento:

- Valida todas las filas antes de guardar.
- Si hay errores, no importa ninguna fila.
- Retorna errores por numero de fila.
- Rechaza archivos sobre 1 MB.
- Rechaza archivos sobre 1000 filas.
- Rechaza archivos que no esten codificados en UTF-8.
- Registra evento tecnico de auditoria con total de filas, importados y fallidos.
- Rechaza emails duplicados dentro del archivo y emails ya existentes en clientes activos.

Respuesta exitosa:

```json
{
  "totalFilas": 2,
  "importados": 2,
  "fallidos": 0,
  "errores": []
}
```

Respuesta con errores de validacion:

```json
{
  "totalFilas": 1,
  "importados": 0,
  "fallidos": 1,
  "errores": [
    {
      "fila": 2,
      "errores": ["email: value is not a valid email address"]
    }
  ]
}
```

## Archivos relacionados

- `Backend/app/api/clientes.py`
- `Backend/app/models/cliente.py`
- `Backend/app/services/clientes.py`
- `Backend/tests/test_clientes_permissions.py`
