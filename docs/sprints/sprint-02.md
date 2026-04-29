# Sprint 02 — EPIC 2: CRM, Usuarios y Datos Base

**Fecha inicio:** 24 de abril 2026
**Fecha actualización:** 28 de abril 2026
**Estado:** 🔄 En proceso
**Ramas:** `feature/crm-clientes` (backend) | `feature/auth-users` (documentación) | `main` (frontend)

---

## Objetivo

Desarrollar la base del CRM: módulo de clientes con CRUD completo en backend (con control de acceso por roles y Firestore conectado) y visualización con datos mock en frontend, previo a la integración real.

---

## Tareas completadas

| Ticket | Descripción | Responsable | Estado |
|--------|-------------|-------------|--------|
| EV-011 | Creación frontend con React + Vite | Frontend | ✅ |
| EV-012 | Estructura base del proyecto (`src/components`, `pages`, `data`, `services`) | Frontend | ✅ |
| EV-013 | Datos mock `mockClientes.js` | Frontend | ✅ |
| EV-014 | Pantalla CRM clientes con listado y búsqueda | Frontend | ✅ |
| EV-015 | Estilos base (`App.css`, `index.css`) | Frontend | ✅ |
| EV-016 | Navegación con `react-router-dom` | Frontend | ✅ |
| EV-017 | Formulario "Crear Cliente" (mock) | Frontend | ✅ |
| EV-018 | Modelo Pydantic `Cliente` con campos BANT, industria y opcionales | Backend | ✅ |
| EV-019 | Servicio Firestore para clientes (`firebase_admin.firestore.client()`) | Backend | ✅ |
| EV-020 | `GET /clientes/` — listar clientes (filtrado por rol) | Backend | ✅ |
| EV-021 | `POST /clientes/` — crear cliente | Backend | ✅ |
| EV-022 | `GET /clientes/{id}` — detalle cliente (con control de acceso) | Backend | ✅ |
| EV-023 | `PUT /clientes/{id}` — editar cliente | Backend | ✅ |
| EV-024 | `DELETE /clientes/{id}` — eliminar cliente | Backend | ✅ |
| EV-026 | Modelo Pydantic `Usuario` con enum de roles (`vendedor`, `supervisor`, `admin`) | Backend | ✅ |
| EV-026b | Servicio de gestión de usuarios en Firestore (`usuarios.py`) | Backend | ✅ |
| EV-026c | Endpoints REST para usuarios — solo `admin`/`supervisor` (`/usuarios/`) | Backend | ✅ |
| EV-026d | `get_current_user` enriquecido con rol desde Firestore + `require_rol()` (`auth.py`) | Backend | ✅ |

---

## Control de acceso implementado

| Rol | Clientes | Usuarios |
|-----|----------|----------|
| Vendedor | Solo los suyos (lectura/edición) | Sin acceso |
| Supervisor | Todos (lectura) | Listar |
| Admin | Todos (CRUD completo) | CRUD completo |

---

## Tareas pendientes

| Ticket | Descripción | Responsable |
|--------|-------------|-------------|
| EV-025 | Pantallas de login y sesión | Frontend |
| EV-027 | Dashboard vendedor | Frontend / Backend |
| EV-028 | Importación CSV | Backend |
| — | Integración frontend ↔ backend (reemplazar mocks por llamadas reales a la API) | Frontend / Backend |

---

## Archivos creados / modificados

**Frontend:**
frontend/
├── src/
│ ├── data/
│ │ └── mockClientes.js
│ ├── pages/
│ │ ├── Clientes.jsx
│ │ └── CrearCliente.jsx
│ ├── components/
│ ├── services/
│ ├── App.jsx
│ ├── App.css
│ ├── index.css
│ └── main.jsx
├── package.json
└── vite.config.js

**Backend:**
app/
├── models/
│ ├── cliente.py
│ └── usuario.py
├── services/
│ ├── clientes.py
│ ├── usuarios.py
│ └── firestore.py ← corregido para usar firebase_admin.firestore.client()
├── routers/
│ ├── clientes.py
│ └── usuarios.py
├── core/
│ └── auth.py ← get_current_user + require_rol()
└── main.py ← routers registrados, Firestore inicializado

---

## Infraestructura

- Firestore API habilitada en proyecto `encipharm-c33ac`
- Base de datos Firestore creada en modo desarrollo
- Backend conectado a Firestore en tiempo real (sin mocks)

---

## Commits relevantes

| Hash | Descripción | Rama | Fecha |
|------|-------------|------|-------|
| `ca95639` | `feat: módulo CRM clientes + roles + Firestore conectado` | `feature/crm-clientes` | 28 abr 2026 |
| `825e982` | Merge pull request #6 from `feature/auth-users` | `main` | 25 abr 2026 |
| `c32f8d9` | Merge pull request #5 from `feature/auth-users` | `main` | 25 abr 2026 |

---

## Pull Requests

| PR | Título | Estado |
|----|--------|--------|
| #7 | `feat: Módulo CRM Clientes + Roles + Firestore conectado` | 🟡 Abierto — pendiente merge |
| #6 | Merge `feature/auth-users` → `main` | ✅ Mergeado |
| #5 | Merge `feature/auth-users` → `main` | ✅ Mergeado |

---

## Cómo probar

**Frontend:**
```bash
cd frontend
npm run dev
```
Se visualiza: listado de clientes (mock), búsqueda, navegación y formulario de creación.

**Backend:**
```bash
cd Backend
uv run uvicorn app.main:app --reload
```
Swagger disponible en `http://127.0.0.1:8000/docs` — secciones **CRM Clientes** y **Usuarios**.

### Endpoints validados en Swagger

| Método | Endpoint | Resultado |
|--------|----------|-----------|
| `POST` | `/clientes/` | 201 ✅ |
| `GET` | `/clientes/` | Filtrado por rol ✅ |
| `GET` | `/clientes/{id}` | Control de acceso ✅ |
| `PUT` | `/clientes/{id}` | Actualización ✅ |
| `DELETE` | `/clientes/{id}` | Eliminación ✅ |

---

## Resultado parcial

Backend CRM operativo con CRUD completo validado en Swagger, control de acceso por roles (`vendedor`, `supervisor`, `admin`) y conexión real a Firestore. Gestión de usuarios implementada con restricción por rol. Frontend con visualización mock funcional. Pendiente integración frontend ↔ backend y módulo de autenticación en pantalla.
a