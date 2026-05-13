# Enci Ventas Backend

API FastAPI del MVP web Enci Ventas. Centraliza autenticacion Firebase, autorizacion por rol, acceso a Firestore, CRM, flujo comercial, dashboards y hardening base.

## Desarrollo local

```bash
uv sync
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

## Variables

Crear `Backend/.env` desde `.env.example`.

Variables obligatorias:

- `APP_ENV`
- `CORS_ORIGINS`
- `FIREBASE_PROJECT_ID`
- `GOOGLE_APPLICATION_CREDENTIALS`

Variables opcionales para la consola Swagger custom:

- `FIREBASE_WEB_API_KEY`
- `FIREBASE_WEB_AUTH_DOMAIN`
- `FIREBASE_WEB_STORAGE_BUCKET`
- `FIREBASE_WEB_MESSAGING_SENDER_ID`
- `FIREBASE_WEB_APP_ID`
- `FIREBASE_WEB_MEASUREMENT_ID`

## Modulos

| Modulo | Archivo |
|--------|---------|
| Auth | `app/api/auth.py` |
| Clientes | `app/api/clientes.py` |
| Comercial | `app/api/comercial.py` |
| Dashboard | `app/api/dashboard.py` |
| Usuarios | `app/api/users.py` |
| Seguridad | `app/core/auth.py`, `app/core/rate_limit.py` |

## QA

```bash
uv run pytest
```

Resultado de cierre EPIC 4: `38 passed`.

## Documentacion

- `../docs/api/auth.md`
- `../docs/api/clientes.md`
- `../docs/api/comercial.md`
- `../docs/api/dashboard.md`
- `../docs/api/users.md`
- `../docs/qa/epic-04-hardening.md`
