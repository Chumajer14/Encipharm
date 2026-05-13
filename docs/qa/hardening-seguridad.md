# QA - Hardening de Seguridad y Resiliencia

**Fecha:** 13 mayo 2026

**Rama:** `feature-epic-4-hardening-qa`

## Riesgos probados y mitigados

| Riesgo | Mitigacion |
|--------|------------|
| Usuario desactivado sigue usando token valido | `activo=false` bloquea login, `/me` y endpoints con `require_role` |
| Eliminacion irreversible de clientes | `DELETE /clientes/{id}` aplica baja logica con `deletedAt` |
| Carga masiva por listado CRM | `GET /clientes` usa `limit` con rango 1-500 y default 100 |
| CSV gigante | Importacion rechaza archivos sobre 1 MB |
| CSV con demasiadas filas | Importacion rechaza archivos sobre 1000 filas |
| CSV no UTF-8 | Importacion retorna `400` |
| Formula injection | Modelos rechazan textos iniciados con `=`, `+`, `-` o `@` |
| Brute force o rafaga basica | Middleware de rate limit por IP, 120 solicitudes por minuto |
| Payload JSON/multipart sobredimensionado | Middleware rechaza `Content-Length` sobre 1 MB antes del parseo |
| Content-Length invalido | Middleware retorna `400` sin llegar al endpoint |
| Memoria del rate limiter crece por IPs falsas | Limpieza de clientes expirados al alcanzar limite de tracking |
| Dashboard con metricas incompletas por paginacion | Dashboard usa conteo interno sin limite de API |
| Listado de usuarios amplio | `GET /users` usa `limit` entre 1 y 500 |
| CORS permisivo en produccion | Configuracion rechaza `CORS_ORIGINS=["*"]` con `APP_ENV=production` |
| Token persistente en consola `/docs` | Uso de `sessionStorage` y Swagger sin persistencia de autorizacion |
| Acceso directo a Firestore desde cliente | `firestore.rules` versionado con denegacion total; el MVP opera mediante la API FastAPI con Firebase Admin y validacion de roles/propiedad |
| Importacion CSV con duplicados | Validacion atomica por email contra archivo y CRM antes de escribir nuevos clientes |
| Asociacion de propuesta a oportunidad ajena | Validacion de visibilidad de oportunidad antes de crear la propuesta |
| Rutas inexistentes | Pagina 404 real con retorno al flujo principal |
| Sesion expirada | Evento global de token expirado con logout y mensaje de reingreso |
| Acceso frontend con rol insuficiente | `ProtectedRoute` valida rol minimo y muestra pagina 403 controlada |
| Selector temporal de rol | Visible solo en desarrollo con `VITE_ENABLE_TEMP_ROLE_SWITCHER=true`; endpoint bloqueado en produccion |
| Dashboard supervisor sin datos | Estados vacios explicitos para evitar paneles ambiguos |

## Comandos de verificacion

```bash
cd Backend
uv run pytest
```

```bash
cd frontend
npm.cmd run lint
npm.cmd run build
```

## Resultado esperado

- Backend: suite `pytest` completa en verde. Cierre EPIC 4: `38 passed`.
- Frontend: lint y build en verde.

## Referencias

- `docs/qa/epic-04-hardening.md`
- `docs/evm/semana-04.md`
- `docs/estado-proyecto.md`
