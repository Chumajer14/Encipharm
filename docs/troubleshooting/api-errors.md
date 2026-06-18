# Codigos de error de conexion

## Frontend web

- `API_NETWORK_FETCH_FAILED`: el navegador no pudo ejecutar `fetch`. Causas probables: CORS, DNS, red bloqueada, extension del navegador o URL inaccesible.
- `API_HTTP_<status>`: Vercel respondio con HTTP no exitoso y el backend/proxy no entrego un codigo mas especifico.
- `API_ERROR_BODY_NOT_JSON`: el servidor devolvio un error en HTML/texto en vez de JSON.
- `API_SUCCESS_BODY_NOT_JSON`: la respuesta fue `2xx`, pero el cuerpo no era JSON valido.

## EnciApp

- `MOBILE_API_MISSING_TOKEN`: la app intento llamar API sin token Firebase activo.
- `MOBILE_API_NETWORK_FETCH_FAILED`: el navegador/PWA no pudo ejecutar `fetch`.
- `MOBILE_API_HTTP_<status>`: Vercel/backend respondio con HTTP no exitoso sin codigo mas especifico.
- `MOBILE_API_ERROR_BODY_NOT_JSON`: el servidor devolvio error no JSON.
- `MOBILE_API_SUCCESS_BODY_NOT_JSON`: respuesta exitosa no parseable como JSON.

## Proxy Vercel

- `PROXY_BACKEND_FETCH_FAILED`: la funcion serverless no pudo conectar con Render.
- `PROXY_BACKEND_TIMEOUT`: Render no respondio antes de 25 segundos.

Cada error incluye `Metodo`, `Ruta`, `HTTP`, `Backend` y `Trace` cuando estan disponibles. El `Trace` corresponde al header `X-Enci-Trace-Id` generado por el proxy.
