# Arquitectura — Encipharm Ventas

## Visión general

Sistema de gestión de ventas y MiniCRM para Encipharm, construido como monorepo con backend API, frontend web PWA y app móvil (fase 2).

---

## Stack tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Backend | FastAPI + Python 3.12 | Alto rendimiento, tipado estricto, Swagger automático |
| Gestor de dependencias | uv | Reemplaza pip/poetry, más rápido y reproducible |
| Autenticación | Firebase Auth | SSO con Google, JWT sin servidor propio |
| Base de datos | Firestore (GCP) | NoSQL escalable, sincronización offline nativa |
| Frontend | Vue 3 + Vite | PWA instalable, soporte offline |
| Mobile | Flutter (Fase 2) | iOS/Android desde un solo codebase — postpuesto |
| Deploy | GCP (Cloud Run) | Mismo ecosistema que Firebase/Firestore |

---

## Estructura del monorepo
Encipharm/
├── Backend/ ← FastAPI (Python)
│ ├── app/
│ │ ├── core/ ← config, auth JWT
│ │ ├── models/ ← Pydantic schemas
│ │ ├── services/ ← Firebase, Firestore
│ │ └── api/ ← routers por módulo
│ ├── pyproject.toml
│ └── .env
├── Frontend/ ← Vue 3 PWA
├── Mobile/ ← Flutter (postpuesto)
└── docs/ ← documentación del proyecto

---

## Flujo de autenticación

Usuario → Google SSO → Firebase Auth → JWT Token
↓
FastAPI middleware valida token
↓
Firestore guarda/consulta perfil



---

## Decisiones de diseño

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| Firebase Auth | Auth propio JWT | Reduce tiempo de desarrollo, SSO Google incluido |
| Firestore | PostgreSQL | Offline-first nativo, sin migraciones |
| uv | pip + virtualenv | Resolución de dependencias más rápida y reproducible |
| PWA web-first | Flutter desde inicio | Plazo MVP < 3 meses, PWA cubre 90% del caso de uso móvil |

---

## Roles del sistema

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso total, gestión de usuarios |
| `jefe_ventas` | Dashboard, reportes, equipo |
| `vendedor` | Visitas, pipeline, clientes propios |

---

## Alcance MVP (Junio 2026)

- ✅ EPIC 1: Autenticación y modelo de usuarios
- 🔄 EPIC 2: Módulo de clientes y pipeline de ventas
- 🔄 EPIC 3: Dashboard KPIs y reportes básicos
- ⏸️ EPIC 4-5: Integraciones ERP/SAP, app Flutter — Fase 2


