# Setup - Enci Ventas

## Requisitos previos

- Python 3.12 o superior.
- Node.js 20 o superior.
- `uv` instalado globalmente.
- Cuenta de Firebase con proyecto configurado.
- Archivo de credenciales de servicio para desarrollo local.

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
- Swagger UI custom: `http://127.0.0.1:8000/docs`

### Variables de entorno backend

Crea `Backend/.env` basado en `.env.example`:

```env
APP_NAME=Enci Ventas API
APP_ENV=development
APP_VERSION=1.0.0
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:5173"]
CORS_ORIGIN_REGEX=
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json
FIREBASE_WEB_API_KEY=your-firebase-api-key
FIREBASE_WEB_AUTH_DOMAIN=your-auth-domain
FIREBASE_WEB_STORAGE_BUCKET=your-storage-bucket
FIREBASE_WEB_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_WEB_APP_ID=your-app-id
FIREBASE_WEB_MEASUREMENT_ID=your-measurement-id
```

## Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

El frontend queda disponible en `http://127.0.0.1:5173`.

### Variables de entorno frontend

Crea `frontend/.env` basado en `.env.example`:

```env
VITE_APP_NAME=Enci Ventas
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_ENABLE_TEMP_ROLE_SWITCHER=false
```

`VITE_ENABLE_TEMP_ROLE_SWITCHER=true` solo debe usarse en desarrollo local para validar pantallas por rol.

## Verificacion local

### Backend

```bash
cd Backend
uv run pytest
```

### Frontend

```bash
cd frontend
npm.cmd run lint
npm.cmd run build
```

## Endpoints actuales

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/` | Root |
| GET | `/health` | Estado del servidor |
| GET | `/me` | Usuario autenticado, JWT requerido |
| POST | `/auth/login` | Sincroniza perfil de usuario autenticado, JWT requerido |
| POST | `/auth/register` | Crea o retorna perfil de usuario autenticado, JWT requerido |
| PATCH | `/auth/temporary-role` | Cambia rol propio solo en desarrollo, JWT requerido |
| GET/POST | `/clientes` | CRM clientes, JWT requerido |
| PATCH/DELETE | `/clientes/{cliente_id}` | Modificacion o baja logica de cliente visible |
| POST | `/clientes/import-csv` | Importacion CSV, supervisor/admin |
| GET | `/dashboard/vendedor` | Dashboard vendedor |
| GET | `/dashboard/supervisor` | Dashboard supervisor/admin |
| GET/POST/PATCH | `/interacciones`, `/oportunidades`, `/propuestas` | Flujo comercial EPIC 3 |

## Ramas de trabajo

| Rama | Proposito |
|------|-----------|
| `main` | Produccion estable |
| `feature/*` | Desarrollo por modulo |
| `fix/*` | Correcciones acotadas |
| `refactor/*` | Refactors tecnicos |

## Documentacion relacionada

- `docs/README.md`
- `docs/estado-proyecto.md`
- `docs/deploy-vercel-frontend.md`
- `docs/qa/epic-04-hardening.md`
