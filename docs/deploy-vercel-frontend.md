# Deploy frontend en Vercel

Guia para publicar el frontend React/Vite como proyecto independiente en Vercel y compartir una URL de avance.

## Alcance

- Directorio de app: `frontend/`.
- Framework: Vite.
- Build command: `npm run build`.
- Install command: `npm ci`.
- Output directory: `dist`.
- Rutas SPA: todas las rutas reescriben a `index.html`.

El repositorio incluye dos configuraciones:

- `vercel.json` en raiz: permite importar el repositorio completo y construir `frontend/`.
- `frontend/vercel.json`: permite configurar Vercel con Root Directory = `frontend`.

## Variables en Vercel

Configurar estas variables en Project Settings > Environment Variables para Preview y Production:

```env
VITE_APP_NAME=Enci Ventas
VITE_API_BASE_URL=https://api-dev.encipharm.example
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

`VITE_API_BASE_URL` debe apuntar a una API publica con HTTPS. Un backend local en `localhost` no sera accesible desde Vercel.

## Firebase Auth

Agregar el dominio generado por Vercel en Firebase Console > Authentication > Settings > Authorized domains.

Dominios habituales:

```text
<proyecto>.vercel.app
<proyecto>-git-<branch>-<equipo>.vercel.app
```

## CORS del backend

Agregar los dominios de Vercel a `CORS_ORIGINS` del backend:

```env
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:5173","https://<proyecto>.vercel.app","https://<preview>.vercel.app"]
```

En produccion no usar `*` como origen permitido.

## Flujo recomendado

1. Crear el proyecto en Vercel desde el repositorio.
2. Usar Root Directory = `frontend` si se quiere aislar la app web.
3. Cargar variables `VITE_*`.
4. Agregar el dominio Vercel en Firebase Auth.
5. Agregar el mismo dominio en `CORS_ORIGINS` del backend desplegado.
6. Ejecutar un deploy Preview y compartir la URL con Max.
