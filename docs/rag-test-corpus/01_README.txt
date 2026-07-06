# Enci Ventas

Sistema web de gestion comercial y MiniCRM para Enci.

## Estado de cierre

El proyecto queda en **cierre del MVP web** y preparado para UAT/go-live controlado. El alcance cerrado considera frontend web, backend API, autenticacion, Firestore, flujos comerciales, dashboards, readiness, QA y documentacion operativa.

Documentacion principal de cierre:

- `docs/cierre-proyecto.md`
- `docs/evm/cierre-proyecto.md`
- `docs/qa/epic-05-uat-go-live.md`
- `docs/architecture.md`

## Objetivo

Entregar una plataforma interna para que el equipo comercial pueda gestionar clientes, interacciones, oportunidades, propuestas, usuarios, roles, forecast y dashboards desde una solucion web.

## Alcance cerrado del MVP web

- Autenticacion web con Firebase Auth y Google SSO.
- Validacion de ID Token/JWT en backend con Firebase Admin.
- Sincronizacion de usuarios autenticados en Firestore.
- Control de roles `vendedor`, `supervisor` y `admin`.
- Bloqueo de usuarios con `activo=false`.
- CRM de clientes conectado a Firestore.
- Creacion, listado, busqueda, filtros, paginacion, detalle, edicion y eliminacion logica de clientes.
- Unicidad de email para clientes activos en alta y edicion manual.
- Importacion CSV admin con validacion defensiva, duplicados y auditoria.
- Interacciones comerciales.
- Pipeline de oportunidades con creacion, edicion, filtros y detalle.
- Propuestas vinculadas a oportunidad con estados y calculo server-side.
- Dashboard vendedor y supervisor/admin.
- Proyecciones, forecast y exportacion CSV.
- Equipo de ventas, configuracion de usuarios, tema e idioma.
- Asistente documental RAG entregado en estado operativo documentado.
- Readiness, smoke test, hardening y documentacion de cierre.
- Frontend con code splitting por ruta y build sin warning de bundle grande.
- Dependencias frontend sin vulnerabilidades reportadas por `npm audit --audit-level=low`.

## No considerado en el cierre web

No forman parte del cierre del CRM web: ERP SAP, calendario operativo, notificaciones push, OCR, firma digital, geolocalizacion avanzada, BI extendido, migracion historica sin fuente aprobada ni integraciones externas no documentadas.

## Stack tecnologico

- **Frontend web:** React + Vite.
- **Backend API:** FastAPI.
- **Base de datos:** Cloud Firestore.
- **Autenticacion:** Firebase Auth con Google SSO.
- **Autorizacion:** Bearer token validado con Firebase Admin.
- **Deploy backend previsto:** Cloud Run o runtime compatible.
- **Deploy frontend:** Vercel.

## Estructura del repositorio

```text
/
├── Backend/
├── frontend/
├── docs/
├── tools/
├── firebase.json
├── firestore.rules
└── README.md
```

## Flujo de autenticacion

1. El usuario entra al frontend y usa login Google.
2. Firebase Auth emite un ID Token.
3. El frontend envia el token al backend:

```http
Authorization: Bearer <firebase_id_token>
```

4. FastAPI valida el token con Firebase Admin.
5. El backend consulta o crea el usuario en Firestore.
6. Las reglas de rol, propiedad y estado activo se aplican en backend.

## Endpoints principales

### Salud y readiness

```http
GET /health
GET /readiness
```

`/readiness` valida configuracion minima de UAT/go-live sin exponer secretos. En ambientes desplegados falla si el cambio temporal de rol queda habilitado o si CORS contiene origenes locales.

### Usuario y autenticacion

```http
GET /me
POST /auth/login
POST /auth/register
```

### Clientes

```http
GET /clientes
POST /clientes
GET /clientes/{id}
PATCH /clientes/{id}
DELETE /clientes/{id}
POST /clientes/import-csv
```

### Flujo comercial

```http
GET /interacciones
POST /interacciones
GET /oportunidades
POST /oportunidades
PATCH /oportunidades/{id}
GET /oportunidades/{id}/detalle
GET /propuestas
POST /propuestas
PATCH /propuestas/{id}
```

### Usuarios y RAG

```http
GET /users
GET /users/{uid}
PATCH /users/{uid}
POST /rag/chat
GET /rag/conversations
POST /rag/documents/upload
POST /rag/documents/reindex
GET /rag/documents
```

## Variables de entorno

### Backend

```env
APP_NAME=Enci Ventas API
APP_ENV=development
APP_VERSION=1.0.0
ENABLE_TEMPORARY_ROLE_SWITCHER=false
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:5173"]
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json
```

### Frontend

```env
VITE_APP_NAME=Enci Ventas
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_TEMP_ROLE_SWITCHER=false
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Instalacion local

### Inicio rapido en Windows

```powershell
.\iniciar-enci-local.bat
```

Servicios esperados:

- Backend FastAPI: `http://127.0.0.1:8000`.
- Frontend web: `http://127.0.0.1:5173`.

### Backend

```bash
cd Backend
uv sync
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

## QA tecnica

```bash
cd frontend
npm audit --audit-level=low
npm run lint
npm run build
```

```bash
python -m pytest Backend\tests\test_clientes_permissions.py Backend\tests\test_readiness.py Backend\tests\test_security_hardening.py
python -m py_compile tools\smoke_crm_web.py
```

## Smoke test de cierre

```bash
python tools/smoke_crm_web.py --env uat --api-base-url https://api.example.com --web-url https://crm.example.com
```

Con token Firebase real:

```bash
python tools/smoke_crm_web.py --env uat --api-base-url https://api.example.com --web-url https://crm.example.com --token <firebase_id_token>
```

## Estado por epic

- EPIC 1: cerrado con base tecnica, Firebase Auth/JWT y estructura backend.
- EPIC 2: cerrado con login, CRM, roles, permisos, CSV y dashboards base.
- EPIC 3: cerrado con interacciones, oportunidades, propuestas y detalle comercial.
- EPIC 4: cerrado con hardening, 403/404, navegacion por rol, QA y dashboards estabilizados.
- EPIC 5: cerrado para Development con readiness, smoke test, UAT docs, paginacion de clientes, creacion/edicion de oportunidades, cierre de vulnerabilidades y code splitting frontend.

## Definition of Done

Un cambio se considera completo si:

- El codigo esta versionado en la rama correspondiente.
- Existe PR revisable.
- Tests, lint, build y audit aplicables pasan.
- La documentacion queda actualizada.
- El cambio respeta el alcance del cierre web.

## Riesgos y condiciones externas

- UAT depende de usuarios reales, dominios, credenciales y ambiente final del cliente.
- Las credenciales Firebase Admin no deben exponerse ni versionarse.
- Firestore debe mantener reglas deny-all para acceso directo desde cliente.
- Las reglas comerciales finales de estados, etapas y aprobaciones deben confirmarse con el cliente.
