# API - Dashboard base

Base URL desarrollo: `http://127.0.0.1:8000`

Todos los endpoints requieren:

```http
Authorization: Bearer <firebase_id_token>
```

## GET `/dashboard/vendedor`

Retorna metricas base de clientes del vendedor autenticado.

Roles permitidos:

- `admin`
- `supervisor`
- `vendedor`

## GET `/dashboard/supervisor`

Retorna metricas base consolidadas de todos los clientes.

Roles permitidos:

- `admin`
- `supervisor`

## Respuesta

```json
{
  "totalClientes": 2,
  "clientesActivos": 2,
  "clientesPorEstado": [
    { "clave": "Completado", "total": 1 },
    { "clave": "En proceso", "total": 1 }
  ],
  "clientesPorRubro": [
    { "clave": "Cerdos", "total": 1 },
    { "clave": "Rumiantes", "total": 1 }
  ],
  "clientesPorRegion": [
    { "clave": "Biobio", "total": 1 },
    { "clave": "Maule", "total": 1 }
  ]
}
```

## Alcance

Este dashboard cubre el cierre backend del EPIC 2. Las metricas de pipeline, propuestas e interacciones quedan para EPIC 3.

## Archivos relacionados

- `Backend/app/api/dashboard.py`
- `Backend/app/models/dashboard.py`
- `Backend/app/services/dashboard.py`
- `Backend/tests/test_clientes_api.py`
