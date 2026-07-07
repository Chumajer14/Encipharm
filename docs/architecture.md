# Arquitectura - Enci Ventas

## Vision general

Enci Ventas es un MiniCRM comercial web construido como monorepo. El cierre del proyecto considera la aplicacion web React/Vite, la API FastAPI, Firebase Auth y Firestore como sistema operativo principal.

El estado de cierre es **MVP web avanzado cerrado para Development**, con salida condicionada a UAT, ambiente final y aprobacion del cliente.

## Stack tecnologico

| Capa | Tecnologia | Uso |
|------|------------|-----|
| Backend | FastAPI + Python 3.12+ | API REST, validaciones, permisos y Swagger controlado |
| Gestor de dependencias | uv | Instalacion reproducible y ejecucion de pruebas |
| Autenticacion | Firebase Auth | Login Google SSO y emision de ID Token |
| Autorizacion | Firebase Admin SDK | Validacion de token, rol, estado activo y propiedad |
| Base de datos | Cloud Firestore | Persistencia de usuarios, clientes y flujo comercial |
| Frontend web | React + Vite | CRM, dashboards, pipeline, propuestas, usuarios y asistente |
| Deploy backend | Cloud Run o runtime compatible | API publica HTTPS para ambientes UAT/produccion |
| Deploy frontend | Vercel | Publicacion independiente del CRM web |

## Estructura del monorepo

```text
Encipharm/
├── Backend/        # FastAPI
│   ├── app/
│   │   ├── api/       # routers por modulo
│   │   ├── core/      # config, auth, readiness, headers y rate limit
│   │   ├── models/    # schemas Pydantic
│   │   └── services/  # Firebase, Firestore y reglas de negocio
│   └── pyproject.toml
├── frontend/       # CRM web React + Vite
├── docs/           # documentacion tecnica, QA, EVM y cierre
├── tools/          # utilidades operativas de smoke/cierre
├── firebase.json
└── firestore.rules
```

## Flujo de autenticacion

```text
Usuario web -> Google SSO -> Firebase Auth -> ID Token
ID Token -> FastAPI valida con Firebase Admin -> Firestore entrega rol/estado
FastAPI -> aplica permisos por rol y propiedad -> responde al frontend
```

Reglas de cierre:

- El frontend nunca escribe directo en Firestore.
- Todo endpoint protegido exige `Authorization: Bearer <firebase_id_token>`.
- Usuario con `activo=false` queda bloqueado.
- El rol `vendedor` solo opera sus propios clientes y registros comerciales.
- `supervisor` consulta datos consolidados y puede aprobar propuestas segun reglas backend.
- `admin` administra usuarios, roles, estado e importacion CSV.

## Modulos cerrados

| Modulo | Estado |
|--------|--------|
| Autenticacion Google SSO | Cerrado para Development |
| Usuarios, roles y estado activo | Cerrado para Development |
| CRM clientes | Cerrado para Development |
| Interacciones comerciales | Cerrado para Development |
| Oportunidades y pipeline | Cerrado para Development |
| Propuestas y calculo server-side | Cerrado para Development |
| Dashboard vendedor/supervisor | Cerrado para Development |
| Proyecciones y forecast exportable | Cerrado para Development |
| Configuracion de usuarios, tema e idioma | Cerrado para Development |
| Asistente documental RAG | Parcialmente entregado y preparado para UAT |
| Readiness, hardening y smoke test | Cerrado para Development |

## Controles de salida

Antes de abrir UAT o go-live, el ambiente objetivo debe cumplir:

- `GET /health` responde `{"status":"ok"}`.
- `GET /readiness` responde `status=ready`.
- `ENABLE_TEMPORARY_ROLE_SWITCHER=false`.
- CORS no contiene origenes localhost en `uat`, `staging` ni `production`.
- `/docs` no queda expuesto en `production`.
- `firestore.rules` mantiene `deny-all` para acceso cliente directo.
- `npm audit --audit-level=low` queda sin vulnerabilidades reportadas.
- `npm run lint`, `npm run build` y pruebas backend relevantes pasan.

## Smoke test operativo

El repositorio incluye un smoke test para validar ambiente publicado:

```bash
python tools/smoke_crm_web.py --env uat --api-base-url https://api.example.com --web-url https://crm.example.com
```

Con token real autorizado:

```bash
python tools/smoke_crm_web.py --env uat --api-base-url https://api.example.com --web-url https://crm.example.com --token <firebase_id_token>
```

## No considerado en el cierre web

No forman parte del cierre del CRM web las integraciones externas no documentadas, migracion historica sin fuente aprobada, calendario operativo, notificaciones push, OCR, firma digital, SAP/ERP, geolocalizacion avanzada, reportes BI extendidos ni la app Flutter nativa dentro de este repositorio. La carpeta `vendedor-app/` corresponde a una PWA React/Vite y no reemplaza por si sola el entregable Flutter externo parcial.
