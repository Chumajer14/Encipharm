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
| `POST /clientes/import-csv` | `admin`, `supervisor` |

Los vendedores solo listan sus propios clientes. Supervisores y administradores pueden filtrar por `vendedorUid`.

## GET `/clientes/`

Lista clientes con filtros simples para el CRM.

Query params:

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `search` | string opcional | Busca por nombre, empresa, email, rubro o region |
| `estado` | string opcional | Filtra por estado |
| `vendedorUid` | string opcional | Filtra por vendedor; se ignora para rol vendedor |

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

## PATCH `/clientes/{cliente_id}`

Actualiza parcialmente un cliente.

```json
{
  "estado": "Completado",
  "region": "Biobio"
}
```

## POST `/clientes/import-csv`

Importa clientes desde un archivo CSV. Requiere `multipart/form-data` con campo `file`.

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
- `Backend/tests/test_clientes_api.py`
