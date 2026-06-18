# EnciApp Vendedor

PWA movil para vendedores de Encipharm. Permite crear cotizaciones, revisar pipeline, consultar forecast y usar el asistente IA RAG desde terreno.

## Desarrollo

```powershell
npm ci
npm run dev
```

Variables requeridas:

```env
VITE_API_BASE_URL=/api
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

En local, `VITE_API_BASE_URL` puede apuntar a `http://localhost:8000`. En Vercel se usa `/api`, proxyeado por `api/[...path].js` hacia el backend FastAPI publicado.

## IA RAG

La ruta `/ia-rag` consume `POST /rag/chat` usando el token Firebase del usuario autenticado. El frontend solo envia:

```json
{
  "pregunta": "consulta del vendedor",
  "conversacion_id": "uuid-opcional"
}
```

El backend resuelve contexto CRM, documentos indexados y proveedor LLM. No se deben agregar llaves de proveedores en esta app ni en variables `VITE_*`.

## Validacion

```powershell
npm run lint
npm run build
```

## Deploy

Proyecto Vercel: `enciapp`.

```powershell
npx vercel --prod
```
