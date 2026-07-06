# Sprint 02 - EPIC 2: CRM, Usuarios y Datos Base

**Fecha de corte:** 2 mayo 2026

**Estado:** Cerrado en consolidado MVP web

**Rama de trabajo backend:** `feature/backend-users-roles`

## Objetivo

Habilitar la base funcional del CRM y del control de permisos para el MVP web: usuarios, roles, clientes, importacion CSV y metricas base para dashboards.

## Alcance trabajado

| Ticket | Descripcion | Area | Estado |
|--------|-------------|------|--------|
| EV-011 | Creacion frontend con React + Vite | Frontend | Completado previamente |
| EV-012 | Estructura base del frontend | Frontend | Completado previamente |
| EV-013 | Datos mock de clientes | Frontend | Completado previamente |
| EV-014 | Pantalla CRM con listado y busqueda mock | Frontend | Completado previamente |
| EV-015 | Estilos base | Frontend | Completado previamente |
| EV-016 | Navegacion con React Router | Frontend | Completado previamente |
| EV-017 | Formulario crear cliente mock | Frontend | Completado previamente |
| EV-018 | Gestion de usuarios y roles backend | Backend | Completado |
| EV-019 | CRUD base de clientes backend | Backend | Completado |
| EV-020 | Importacion CSV con validacion por fila | Backend | Completado |
| EV-021 | Dashboard vendedor/supervisor base via API | Backend | Completado |
| EV-022 | QA automatizado backend EPIC 2 | QA | Completado |

## Continuidad cerrada en consolidado

- Pantallas de login y sesion frontend: completadas en cierre EPIC 2.
- Integracion visual del CRM con endpoints reales: completada.
- Dashboard UI del vendedor y supervisor: completado.
- Pipeline, interacciones y propuestas: completados en EPIC 3.

## Backend implementado

```text
Backend/app/
├── api/
│   ├── clientes.py
│   ├── users.py
│   └── dashboard.py
├── models/
│   ├── cliente.py
│   ├── dashboard.py
│   └── user.py
├── services/
│   ├── clientes.py
│   ├── users.py
│   └── dashboard.py
└── core/
    └── auth.py
```

## Endpoints principales

| Metodo | Ruta | Uso |
|--------|------|-----|
| GET | `/users/` | Lista usuarios |
| GET | `/users/{uid}` | Consulta usuario |
| PATCH | `/users/{uid}` | Actualiza usuario |
| PATCH | `/users/{uid}/role` | Cambia rol |
| PATCH | `/users/{uid}/status` | Activa/desactiva usuario |
| GET | `/clientes/` | Lista clientes con filtros |
| GET | `/clientes/{cliente_id}` | Consulta cliente |
| POST | `/clientes/` | Crea cliente |
| PATCH | `/clientes/{cliente_id}` | Actualiza cliente |
| POST | `/clientes/import-csv` | Importa clientes desde CSV |
| GET | `/dashboard/vendedor` | Metricas del vendedor autenticado |
| GET | `/dashboard/supervisor` | Metricas consolidadas |

## Criterios de aceptacion verificados

- Usuarios y roles protegidos por token Firebase y perfil en Firestore.
- `admin` puede modificar roles y estado.
- `supervisor` puede consultar usuarios y dashboard consolidado.
- `vendedor` no puede administrar usuarios ni importar CSV.
- CRM backend permite crear, listar, buscar, filtrar y actualizar clientes.
- Importacion CSV valida todas las filas antes de guardar.
- Errores de CSV se reportan con numero de fila.
- Dashboard base entrega conteos por estado, rubro y region.

## QA

Suite ejecutada:

```bash
cd Backend
uv run pytest
```

Resultado:

```text
13 passed
```

## Documentacion relacionada

- `docs/api/auth.md`
- `docs/api/users.md`
- `docs/api/clientes.md`
- `docs/api/dashboard.md`
- `docs/qa/epic-02-backend.md`
- `docs/sprints/sprint-02-cierre.md`
- `docs/cierre-proyecto.md`
