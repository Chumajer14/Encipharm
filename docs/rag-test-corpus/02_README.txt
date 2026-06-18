# Enci Ventas Frontend

Frontend web del MVP comercial Enci Ventas. La app usa React, Vite, Firebase Auth y consume la API FastAPI mediante tokens Bearer de Firebase.

## Desarrollo local

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

## Variables

Crear `frontend/.env` desde `.env.example`:

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
```

## Vercel

El proyecto puede desplegarse como frontend independiente en Vercel usando Root Directory = `frontend`.

- Build command: `npm run build`.
- Install command: `npm ci`.
- Output directory: `dist`.
- Configuracion SPA: `frontend/vercel.json`.

Guia operativa: `../docs/deploy-vercel-frontend.md`.

## QA tecnica

```bash
npm run lint
npm run build
```

