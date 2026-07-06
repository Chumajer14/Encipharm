# Setup - Enci Ventas CRM Web

## Requisitos previos

- Python 3.12 o superior.
- Node.js 20 o superior.
- `uv` instalado globalmente.
- Cuenta Firebase con proyecto configurado.
- Credenciales de servicio para desarrollo local o `FIREBASE_SERVICE_ACCOUNT_JSON`.
- Variables `VITE_*` del proyecto Firebase para el frontend.

## Clonar el repositorio

```bash
git clone https://github.com/Chumajer14/Encipharm.git
cd Encipharm
```

## Backend

```bash
cd Backend
uv sync
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

El servidor queda disponible en:

- API: `http://127.0.0.1:8000`
- Swagger UI no-produccion: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`
- Readiness: `http://127.0.0.1:8000/readiness`

### Variables de entorno backend

Crear `Backend/.env` desde `Backend/.env.example`.

Valores minimos:

```env
APP_NAME=Enci Ventas API
APP_ENV=development
APP_VERSION=1.0.0
ENABLE_TEMPORARY_ROLE_SWITCHER=false
CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json
```

Para UAT, staging o produccion:

- `ENABLE_TEMPORARY_ROLE_SWITCHER=false`
- `CORS_ORIGINS` solo con dominios publicados.
- `FIREBASE_PROJECT_ID` real.
- `FIREBASE_SERVICE_ACCOUNT_JSON` o `GOOGLE_APPLICATION_CREDENTIALS` valido.
- `DEEPSEEK_API_KEY` configurada si se usara `/rag/chat`.

## Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

El frontend queda disponible en `http://127.0.0.1:5173`.

### Variables de entorno frontend

Crear `frontend/.env` desde `frontend/.env.example`.

```env
VITE_APP_NAME=Enci Ventas
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_ENABLE_TEMP_ROLE_SWITCHER=false
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Seed demo

Para cargar datos comerciales de prueba al usuario `max@wellq.co.uk`:

```bash
cd Backend
uv run python scripts/seed_max_wellq_demo.py --apply
```

El seed crea clientes, oportunidades, propuestas e interacciones deterministicas para pruebas funcionales.

## Verificacion local

### Backend

```bash
cd Backend
uv run pytest
```

Suite focal de cierre:

```bash
python -m pytest Backend\tests\test_clientes_permissions.py Backend\tests\test_readiness.py Backend\tests\test_security_hardening.py
```

### Frontend

```bash
cd frontend
npm audit --audit-level=low
npm run lint
npm run build
```

## Smoke test de ambiente publicado

```bash
python tools/smoke_crm_web.py --env uat --api-base-url https://api.example.com --web-url https://crm.example.com
```

Con token Firebase real:

```bash
python tools/smoke_crm_web.py --env uat --api-base-url https://api.example.com --web-url https://crm.example.com --token <firebase_id_token>
```

## Endpoints actuales

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/` | Root API |
| GET | `/health` | Estado basico del servidor |
| GET | `/readiness` | Validacion no sensible de UAT/go-live |
| GET | `/me` | Usuario autenticado |
| POST | `/auth/login` | Login/sync de usuario autenticado |
| GET/POST | `/clientes` | Listado y alta de clientes |
| GET/PATCH/DELETE | `/clientes/{id}` | Detalle, edicion y baja logica |
| POST | `/clientes/import-csv` | Importacion CSV admin |
| GET/POST | `/interacciones` | Interacciones comerciales |
| GET/POST/PATCH | `/oportunidades` | Oportunidades y pipeline |
| GET/POST/PATCH | `/propuestas` | Propuestas comerciales |
| GET/PATCH | `/users` | Gestion de usuarios |
| POST/GET | `/rag/*` | Asistente documental |

## Ramas

| Rama | Proposito |
|------|-----------|
| `main` | Base estable |
| `cierre-proyecto` | Cierre CRM web y documentacion |
| `feature/*` | Trabajo acotado por modulo |
