# Arquitectura - Enci Ventas

## Vision general

Sistema de gestion de ventas y MiniCRM para Enci, construido como monorepo con backend API, frontend web y carpeta mobile reservada para Fase 2.

## Stack tecnologico

| Capa | Tecnologia | Justificacion |
|------|------------|---------------|
| Backend | FastAPI + Python 3.12+ | Alto rendimiento, tipado y Swagger automatico |
| Gestor de dependencias | uv | Instalacion reproducible y rapida |
| Autenticacion | Firebase Auth | SSO con Google y validacion de JWT |
| Base de datos | Firestore | NoSQL administrado en el ecosistema Firebase/GCP |
| Frontend | React + Vite | MVP web rapido, liviano y validable |
| Mobile | Flutter (Fase 2) | iOS/Android desde un solo codebase cuando el MVP web este estable |
| Deploy previsto | GCP Cloud Run | Mismo ecosistema que Firebase/Firestore |

## Estructura del monorepo

```text
Enci/
├── Backend/        # FastAPI
│   ├── app/
│   │   ├── api/       # routers por modulo
│   │   ├── core/      # config y auth JWT
│   │   ├── models/    # schemas Pydantic
│   │   └── services/  # Firebase y Firestore
│   └── pyproject.toml
├── frontend/       # React + Vite
├── mobile/         # Fase 2
└── docs/
```

## Flujo de autenticacion

```text
Usuario -> Google SSO -> Firebase Auth -> JWT
JWT -> FastAPI valida token -> Firestore guarda/consulta perfil
```

## Roles del sistema

| Rol | Permisos esperados |
|-----|--------------------|
| `admin` | Acceso total y gestion de usuarios |
| `supervisor` | Dashboard, reportes y equipo |
| `vendedor` | Clientes propios, visitas y pipeline |

## Alcance MVP

- EPIC 1: autenticacion y modelo de usuarios.
- EPIC 2: CRM, login web, usuarios/roles, dashboard base e importacion CSV.
- EPIC 3: interacciones, pipeline y propuestas basicas.
- EPIC 4: dashboards, hardening, QA y navegacion por rol cerrados para Development; migracion diferida.
- EPIC 5: UAT, documentacion y go-live.

## Estado actual

- Backend FastAPI inicializado con Firebase Auth/JWT.
- Registro de perfil de usuario autenticado en Firestore.
- Frontend React con CRM mock, busqueda y formulario de creacion mock.
- Mobile, SAP, IA, Google Calendar y reportes extendidos quedan fuera del MVP.
