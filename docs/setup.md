# Setup - Encipharm Ventas

## Requisitos previos

- Python 3.12 o superior.
- Node.js 20 o superior.
- `uv` instalado globalmente.
- Cuenta de Firebase con proyecto configurado.
- Archivo de credenciales de servicio para desarrollo local.

## Clonar el repositorio

```bash
git clone https://github.com/tu-org/Encipharm.git
cd Encipharm
```

## Backend

```bash
cd Backend
uv sync
uv run uvicorn app.main:app --reload
```

El servidor queda disponible en:

- API: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`

### Variables de entorno backend

Crea `Backend/.env` basado en estos valores:

```env
APP_NAME=Encipharm Ventas API
APP_ENV=development
APP_VERSION=1.0.0
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend queda disponible por defecto en `http://localhost:5173`.

## Verificacion local

### Backend

```bash
cd Backend
uv run pytest
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
npm test
```

## Endpoints actuales

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/` | Root |
| GET | `/health` | Estado del servidor |
| GET | `/me` | Usuario autenticado, JWT requerido |
| POST | `/auth/register` | Crea o retorna perfil de usuario autenticado, JWT requerido |

## Ramas de trabajo

| Rama | Proposito |
|------|-----------|
| `main` | Produccion estable |
| `develop` | Integracion |
| `feature/*` | Desarrollo por modulo |
