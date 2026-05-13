# API - Dashboard

Base URL desarrollo: `http://127.0.0.1:8000`

Todos los endpoints requieren:

```http
Authorization: Bearer <firebase_id_token>
```

## GET `/dashboard/vendedor`

Retorna metricas de clientes y flujo comercial del vendedor autenticado.

Roles permitidos:

- `admin`
- `supervisor`
- `vendedor`

Cuando el rol es `vendedor`, la API filtra por `vendedorUid` del usuario autenticado.

## GET `/dashboard/supervisor`

Retorna metricas consolidadas de todos los clientes y registros comerciales.

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
  ],
  "totalOportunidades": 3,
  "valorPipeline": 1500000,
  "totalPropuestas": 4,
  "valorPropuestasAceptadas": 900000,
  "oportunidadesPorEtapa": [
    { "clave": "cotizacion", "total": 2 },
    { "clave": "negociacion", "total": 1 }
  ],
  "propuestasPorEstado": [
    { "clave": "aceptada", "total": 1 },
    { "clave": "enviada", "total": 3 }
  ]
}
```

## Estados vacios frontend

El frontend muestra cero en tarjetas numericas cuando la API no retorna datos y textos explicitos en paneles agregados:

- `Sin clientes por rubro.`
- `Sin clientes por region.`
- `Sin oportunidades por etapa.`
- `Sin propuestas por estado.`

## Archivos relacionados

- `Backend/app/api/dashboard.py`
- `Backend/app/models/dashboard.py`
- `Backend/app/services/dashboard.py`
- `Backend/tests/test_clientes_permissions.py`
- `frontend/src/pages/Dashboard.jsx`
