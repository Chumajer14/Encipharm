# Sprint 03 - EPIC 3: Interacciones, Pipeline y Propuestas

**Fecha de inicio:** 5 mayo 2026

**Rama:** `feature-epic-3-flujo-comercial`

**Estado:** Completado

## Objetivo

Completar el flujo comercial minimo del equipo de ventas: registrar interacciones, gestionar oportunidades en pipeline y crear propuestas con estados y calculos basicos.

## Alcance implementado

| Ticket | Descripcion | Area | Estado |
|--------|-------------|------|--------|
| EV-023 | API de interacciones y visitas | Backend | Completado |
| EV-024 | API de oportunidades y pipeline | Backend | Completado |
| EV-025 | API de propuestas con calculo basico | Backend | Completado |
| EV-026 | Relacion cliente-oportunidad-propuesta | Backend | Completado |
| EV-027 | UI de interacciones | Frontend | Completado |
| EV-028 | UI pipeline Kanban | Frontend | Completado |
| EV-029 | UI propuestas y estados | Frontend | Completado |
| EV-030 | QA automatizado EPIC 3 base | QA | Completado |
| EV-031 | Filtros por etapa/estado en frontend y API | Fullstack | Completado |
| EV-032 | Vista de detalle por oportunidad | Fullstack | Completado |
| EV-033 | Historial comercial en detalle de cliente | Frontend | Completado |
| EV-034 | Dashboard supervisor con pipeline y propuestas | Fullstack | Completado |

## Backend implementado

```text
Backend/app/
├── api/comercial.py
├── models/comercial.py
└── services/comercial.py
```

## Frontend implementado

```text
frontend/src/pages/
├── Interacciones.jsx
├── Oportunidades.jsx
└── Propuestas.jsx
```

## Endpoints principales

| Metodo | Ruta | Uso |
|--------|------|-----|
| GET | `/interacciones` | Lista interacciones visibles |
| POST | `/interacciones` | Registra interaccion |
| GET | `/oportunidades` | Lista oportunidades visibles |
| POST | `/oportunidades` | Crea oportunidad |
| PATCH | `/oportunidades/{id}` | Actualiza etapa/datos |
| GET | `/oportunidades/{id}/detalle` | Consulta oportunidad con interacciones y propuestas |
| GET | `/propuestas` | Lista propuestas visibles |
| POST | `/propuestas` | Crea propuesta |
| PATCH | `/propuestas/{id}` | Actualiza estado/datos |

## Criterios de aceptacion verificados

- Vendedor solo crea registros sobre clientes propios.
- Supervisor/admin pueden consultar registros consolidados.
- Oportunidades se mueven entre etapas del pipeline.
- Propuestas calculan descuento y total.
- Propuesta no puede vincularse a una oportunidad de otro cliente.
- Payloads comerciales bloquean formula injection.
- Frontend expone pantallas reales para interacciones, oportunidades y propuestas.
- Frontend permite filtrar oportunidades por etapa y propuestas por estado.
- Detalle de oportunidad muestra seguimiento, propuestas vinculadas e interacciones del cliente.
- Detalle de cliente muestra historial comercial embebido.
- Dashboard supervisor consolida oportunidades, valor de pipeline y propuestas.

## QA

Suite ejecutada:

```bash
cd Backend
uv run pytest
```

Resultado esperado:

```text
28 passed
```

## QA adicional ejecutado

```bash
cd frontend
npm run build
npm run lint
```

Resultados:

- Backend: `28 passed`.
- Frontend build: exitoso.
- Frontend lint: exitoso.
