# Sprint 02 — EPIC 2: CRM, Usuarios y Datos Base

**Fecha inicio:** 24 de abril 2026  
**Estado:** 🔄 En proceso  
**Ramas:** `feature/crm-clientes` (backend) | `main` (frontend)

---

## Objetivo

Desarrollar la base del CRM: módulo de clientes con CRUD completo en backend y visualización con datos mock en frontend, previo a la integración real.

---

## Tareas completadas

| Ticket | Descripción | Responsable | Estado |
|--------|-------------|-------------|--------|
| EV-011 | Creación frontend con React + Vite | Frontend | ✅ |
| EV-012 | Estructura base del proyecto (`src/components`, `pages`, `data`, `services`) | Frontend | ✅ |
| EV-013 | Datos mock `mockClientes.js` | Frontend | ✅ |
| EV-014 | Pantalla CRM clientes con listado y búsqueda | Frontend | ✅ |
| EV-015 | Estilos base (App.css, index.css) | Frontend | ✅ |
| EV-016 | Navegación con `react-router-dom` | Frontend | ✅ |
| EV-017 | Formulario "Crear Cliente" (mock) | Frontend | ✅ |
| EV-018 | Modelo Pydantic `Cliente` | Backend | ✅ |
| EV-019 | Servicio Firestore para clientes | Backend | ✅ |
| EV-020 | `GET /clientes/` — listar clientes | Backend | ✅ |
| EV-021 | `POST /clientes/` — crear cliente | Backend | ✅ |
| EV-022 | `GET /clientes/{id}` — detalle cliente | Backend | ✅ |
| EV-023 | `PUT /clientes/{id}` — editar cliente | Backend | ✅ |
| EV-024 | `DELETE /clientes/{id}` — eliminar cliente | Backend | ✅ |

---

## Tareas pendientes

| Ticket | Descripción | Responsable |
|--------|-------------|-------------|
| EV-025 | Pantallas de login y sesión | Frontend |
| EV-026 | Gestión de usuarios y roles | Backend |
| EV-027 | Dashboard vendedor | Frontend/Backend |
| EV-028 | Importación CSV | Backend |

---

## Archivos creados

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
│ └── cliente.py
├── services/
│ └── clientes.py
└── api/
└── clientes.py

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
Swagger disponible en `http://127.0.0.1:8000/docs` — sección "CRM Clientes".

---

## Resultado parcial

Backend CRM operativo con 5 endpoints CRUD validados en Swagger. Frontend con visualización mock funcional. Pendiente integración frontend ↔ backend y módulo de autenticación en pantalla.