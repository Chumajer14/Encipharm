# QA - Hardening de Seguridad y Resiliencia

**Fecha:** 5 mayo 2026

**Rama:** `feature-epic-2-cierre-crm`

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
| CORS permisivo en produccion | Configuracion rechaza `CORS_ORIGINS=["*"]` con `APP_ENV=production` |
| Token persistente en consola `/docs` | Uso de `sessionStorage` y Swagger sin persistencia de autorizacion |
| Rutas frontend no implementadas | Pantallas protegidas de modulo pendiente para EPIC 3 |

## Comandos de verificacion

```bash
cd Backend
uv run pytest
python -m compileall app tests
```

```bash
cd frontend
npm run lint
npm run build
npm audit --audit-level=moderate
```

## Resultado esperado

- Backend: suite `pytest` completa en verde.
- Backend: compilacion Python sin errores de sintaxis.
- Frontend: lint y build en verde.
- Dependencias frontend: sin vulnerabilidades moderadas o superiores.
