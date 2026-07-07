# Enci Ventas / MiniCRM Comercial

Sistema web de gestion comercial para Enci, desarrollado como MVP avanzado por el Grupo PLM de la UTEM.

## Descripcion

Enci Ventas centraliza la gestion de clientes, usuarios, roles, interacciones, oportunidades, propuestas, dashboards comerciales, importacion CSV y asistencia documental RAG en una arquitectura web con backend FastAPI, frontend React/Vite, Firebase Auth, Firebase Admin y Cloud Firestore.

El repositorio queda preparado para entrega tecnica, UAT y go-live condicionado por credenciales, dominios y validacion final del cliente.

## Alcance entregado

- MVP web comercial con login Google mediante Firebase Auth.
- API FastAPI con validacion de Bearer token usando Firebase Admin.
- Sincronizacion de usuarios autenticados en Firestore.
- Roles `vendedor`, `supervisor`, `admin` y estado `sin_acceso`.
- Bloqueo de usuarios inactivos y control de acceso por `webApp`/`appMovil`.
- CRM de clientes conectado a backend y Firestore.
- Creacion, listado, busqueda, filtros, paginacion, detalle, edicion y baja logica de clientes.
- Importacion CSV administrada con validaciones defensivas.
- Interacciones, oportunidades, propuestas y detalle comercial.
- Dashboard vendedor y dashboard supervisor/admin.
- Forecast, proyecciones y exportacion CSV.
- Administracion de usuarios, roles, estado, tema e idioma.
- Asistente Enci RAG parcialmente entregado, con endpoints backend, historial, documentos e indexacion.
- App Vendedor/PWA React/Vite dentro del repositorio.
- Readiness, hardening, QA tecnica y documentacion de cierre.

## Componentes del repositorio

```text
/
|-- Backend/              # API FastAPI, routers, modelos, servicios, tests y config
|-- frontend/             # CRM web React/Vite
|-- vendedor-app/         # App Vendedor/PWA React/Vite
|-- docs/                 # Documentacion tecnica, QA, API, deploy, sprints y entrega
|-- tools/                # Scripts de smoke test y generacion documental
|-- firebase.json         # Configuracion Firebase del repo
|-- firestore.rules       # Reglas Firestore deny-all para acceso directo
|-- vercel.json           # Deploy frontend web
|-- README.md
```

## Estado de IA RAG

El RAG esta parcialmente entregado y preparado para validacion controlada. No debe presentarse como plataforma IA completa, producto con SLA definitivo, fine-tuning o evaluacion masiva.

Incluye:

- `POST /rag/chat`
- `GET /rag/conversations`
- `POST /rag/documents/upload`
- `POST /rag/documents/reindex`
- `GET /rag/documents`
- DeepSeek consumido solo desde backend.
- Chroma como indice vectorial local configurable.
- GCS o almacenamiento local para documentos segun variables.
- Historial de conversaciones por usuario.
- Upload, reindex y listado documental restringidos a `admin`.

Condiciones:

- Requiere `DEEPSEEK_API_KEY` real para ambiente desplegado.
- Requiere corpus documental definitivo validado por el cliente.
- Chroma local no sustituye por si solo una estrategia productiva de persistencia controlada.

## Estado de App Vendedor / Flutter

`vendedor-app/` corresponde a una PWA movil React/Vite dentro de este repositorio. Usa Firebase Auth, consume la API con token Bearer, contiene navegacion inferior, inicio, cotizaciones, pipeline, proyeccion, Enci Chat y configuracion.

La app Flutter nativa se considera entregable externo parcial, desarrollado fuera de este repositorio. Su ausencia en GitHub no es incumplimiento del alcance de este repo.

## Arquitectura

- Frontend web React/Vite en Vercel.
- App Vendedor/PWA React/Vite en Vercel o runtime estatico compatible.
- Backend FastAPI en Cloud Run, Render o runtime ASGI compatible.
- Firebase Auth para identidad.
- Firebase Admin en backend para validar tokens.
- Cloud Firestore como base de datos.
- Reglas Firestore deny-all para impedir acceso directo abierto desde cliente.
- RAG backend con DeepSeek, Chroma y almacenamiento documental configurable.

El frontend y la PWA deben consumir datos de negocio a traves del backend. La configuracion Firebase expuesta en frontend es publica por naturaleza; las credenciales privadas solo corresponden al backend y no deben versionarse.

## Instalacion local

Inicio rapido en Windows:

```powershell
.\iniciar-enci-local.bat
```

Backend:

```bash
cd Backend
uv sync
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Frontend web:

```bash
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

App Vendedor/PWA:

```bash
cd vendedor-app
npm ci
npm run dev -- --host 127.0.0.1 --port 5174
```

## Variables de entorno

Backend:

```env
APP_NAME=Enci Ventas API
APP_ENV=development
APP_VERSION=1.0.0
ENABLE_TEMPORARY_ROLE_SWITCHER=false
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://localhost:5174","http://127.0.0.1:5173","http://127.0.0.1:5174"]
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json
FIREBASE_SERVICE_ACCOUNT_JSON=
DEEPSEEK_API_KEY=your_deepseek_api_key_here
CHROMA_PERSIST_DIR=./chroma_db
GCS_BUCKET_DOCUMENTS=
LOCAL_DOCUMENT_STORAGE_DIR=./document_storage
```

Frontend web:

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

App Vendedor/PWA:

```env
VITE_API_BASE_URL=/api
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Los placeholders anteriores son ejemplos documentales. No se deben versionar `.env`, service accounts, llaves privadas Firebase, tokens ni API keys reales.

## QA y validacion

Comandos esperados:

```bash
cd Backend
uv sync
uv run pytest
```

```bash
cd frontend
npm ci
npm run lint
npm run build
```

```bash
cd vendedor-app
npm ci
npm run lint
npm run build
```

Smoke test de ambiente publicado:

```bash
python tools/smoke_crm_web.py --env uat --api-base-url https://api.example.com --web-url https://crm.example.com
```

Con token real:

```bash
python tools/smoke_crm_web.py --env uat --api-base-url https://api.example.com --web-url https://crm.example.com --token <firebase_id_token>
```

## Despliegue

- Frontend web: Vercel, con `frontend/` como proyecto o build configurado desde la raiz.
- App Vendedor/PWA: Vercel separado con root `vendedor-app/`.
- Backend: Cloud Run, Render u otro runtime compatible con FastAPI/ASGI.
- Firebase Auth: validar dominios autorizados para web y PWA.
- CORS: configurar solo origenes reales del ambiente, sin `*` en produccion.
- Swagger/OpenAPI: `/openapi.json` queda deshabilitado en `APP_ENV=production`.
- `/docs`: consola de pruebas propia del backend; no debe exponerse como superficie productiva publica sin control de ambiente.

## Documentacion de entrega

La carpeta `docs/final-delivery/` consolida la evidencia de auditoria final del repositorio:

- Inventario final.
- Residuales y limpieza.
- Matriz docs vs repo.
- Cumplimiento de entrega.
- Endpoints verificados.
- Validacion RAG.
- Auditoria de seguridad.
- Arquitectura verificada.
- Checklist UAT/go-live.
- Resultados de validacion.
- Riesgos residuales.
- Resumen ejecutivo.

## Exclusiones

Quedan fuera del alcance cerrado de este repositorio salvo evidencia futura:

- ERP SAP.
- Google Calendar operativo.
- WhatsApp productivo.
- Mapas/geolocalizacion avanzada.
- OCR y firma digital.
- BI extendido.
- Offline total.
- Publicacion Play Store/App Store.
- Fine-tuning, evaluacion masiva o SLA productivo del proveedor IA.
- App Flutter nativa dentro del repositorio.

## Residual autorizado temporalmente

El CRM web contiene una barra superior temporal de pruebas para cambio de rol (`Vendedor`/`Administrador`). Por instruccion del equipo, esta barra debe mantenerse intacta durante esta auditoria y retirarse manualmente solo antes de la entrega productiva final.

## Equipo PLM UTEM

- Lider: Joshua Flores.
- Integrantes: Falon Berrios, Carolaine Palacios y Eliseo Poblete.
