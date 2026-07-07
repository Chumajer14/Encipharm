# EnciApp Vendedor

PWA movil para vendedores de Enci. Permite crear cotizaciones, revisar pipeline, consultar forecast y usar Enci Chat desde terreno.

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

Para desarrollo local dentro de este repositorio, `vendedor-app/.env` reutiliza la configuracion web publica de Firebase presente en `frontend/.env` y usa `http://localhost:8000` como API. El archivo local permanece excluido de Git.

En Vercel, las variables `VITE_FIREBASE_*` deben existir tanto en Production como en Preview. Los dominios `localhost` y `enciapp.vercel.app` deben permanecer autorizados en Firebase Authentication.

En local, `VITE_API_BASE_URL` puede apuntar a `http://localhost:8000`. En Vercel se usa `/api`, proxyeado por `api/[...path].js` hacia el backend FastAPI publicado.

## Enci Chat

La ruta `/enci-chat` consume `POST /rag/chat` usando el token Firebase del usuario autenticado. `/ia-rag` se conserva como redireccion de compatibilidad. El frontend solo envia:

```json
{
  "pregunta": "consulta del vendedor",
  "conversacion_id": "uuid-opcional"
}
```

Enci Chat comparte con el CRM web:

- Recuperacion desde corpus documental, Firestore e interacciones comerciales.
- Respuestas conversacionales para saludos y preguntas fuera de alcance.
- Historial privado por cuenta y titulos tematicos generados por DeepSeek.
- Envio con `Enter` y salto de linea con `Shift+Enter`.
- Escritura progresiva de respuestas. La trazabilidad tecnica del origen queda en el contrato backend para UAT, no como promesa de IA completa.

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
