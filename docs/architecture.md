# Arquitectura - Enci Ventas

## Vision general

Sistema de gestion de ventas y MiniCRM para Enci, construido como monorepo con backend API, frontend web y carpeta mobile reservada para Fase 2.

## Stack tecnologico

| Capa | Tecnologia | Justificacion |
|------|------------|---------------|
| Backend | FastAPI + Python 3.12+ | Alto rendimiento, tipado y Swagger automatico |
| Gestor de dependencias | uv | Instalacion reproducible y rapida |
| Autenticacion | Firebase Auth | SSO con Google y validacion de JWT |
| Base de datos | Firestore | NoSQL administrado en Firebase/GCP |
| Frontend | React + Vite | MVP web rapido, liviano y validable |
| Mobile | Flutter (Fase 2) | iOS/Android desde un solo codebase cuando el MVP web este estable |
| Deploy backend previsto | GCP Cloud Run | Mismo ecosistema que Firebase/Firestore |
| Preview frontend | Vercel | Publicacion independiente del cliente React/Vite |

## Estructura del monorepo

```text
Encipharm/
|-- Backend/        # FastAPI
|   |-- app/
|   |   |-- api/       # routers por modulo
|   |   |-- core/      # config, auth JWT y middlewares
|   |   |-- models/    # schemas Pydantic
|   |   `-- services/  # Firebase, Firestore y reglas de negocio
|   |-- tests/
|   `-- pyproject.toml
|-- frontend/       # React + Vite
|   `-- src/
|       |-- auth/
|       |-- components/
|       |-- pages/
|       |-- services/
|       `-- utils/
|-- mobile/         # Fase 2
`-- docs/
```

## Flujo de autenticacion

```text
Usuario -> Google SSO -> Firebase Auth -> ID token
ID token -> FastAPI valida token -> Firestore guarda/consulta perfil
Perfil -> rol/activo -> require_role autoriza endpoints
```

## Roles del sistema

| Rol | Permisos esperados |
|-----|--------------------|
| `admin` | Acceso total y gestion de usuarios |
| `supervisor` | Dashboard consolidado, reportes y equipo |
| `vendedor` | Clientes propios, interacciones, oportunidades y propuestas |

Jerarquia efectiva:

```text
admin > supervisor > vendedor
```

El backend aplica autorizacion obligatoria con `require_role`. El frontend refuerza la experiencia con `ProtectedRoute`, pantalla 403 y navegacion contextual.

## Seguridad y resiliencia

- Firebase Admin valida tokens en backend.
- Usuarios inactivos quedan bloqueados en login y endpoints protegidos.
- CORS rechaza comodines en produccion.
- Rate limit por IP: 120 solicitudes por minuto.
- Limite de payload: 1 MB.
- Headers de seguridad: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- Firestore queda cerrado para clientes directos mediante reglas deny-all versionadas.
- El frontend cierra sesion ante respuestas `401`.
- Rutas inexistentes y accesos por rol insuficiente tienen estados 404/403 controlados.

## Alcance MVP

- EPIC 1: autenticacion y modelo de usuarios.
- EPIC 2: CRM, login web, usuarios/roles, dashboard base e importacion CSV.
- EPIC 3: interacciones, pipeline y propuestas basicas.
- EPIC 4: dashboards, hardening, QA y navegacion por rol cerrados para Development; migracion diferida.
- EPIC 5: UAT, documentacion final y go-live.

## Estado actual

- Backend FastAPI con Firebase Auth/JWT, roles, rate limit, limite de payload y headers de seguridad.
- Registro y sincronizacion de perfil de usuario autenticado en Firestore.
- Frontend React con login Google, CRM real, flujo comercial, dashboards, 404 y 403.
- Documentacion de QA, EVM, setup, API y deploy actualizada hasta EPIC 4.
- Mobile, SAP, IA, Google Calendar y reportes extendidos quedan fuera del MVP.
