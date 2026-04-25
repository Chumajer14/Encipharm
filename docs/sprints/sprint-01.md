# Sprint 01 — EPIC 1: Autenticación y Modelo de Usuarios

**Fecha:** 24 de abril 2026  
**Estado:** ✅ Completado  
**Rama:** `feature/auth-users` → mergeada a `main`

---

## Objetivo

Establecer la base técnica del backend: estructura del proyecto, autenticación con Firebase y modelo de usuarios en Firestore.

---

## Tareas completadas

| Ticket | Descripción | Estado |
|--------|-------------|--------|
| EV-001 | Setup proyecto con uv y pyproject.toml | ✅ |
| EV-002 | Estructura de carpetas `app/core`, `app/api`, `app/models`, `app/services` | ✅ |
| EV-003 | Configuración de variables de entorno con Pydantic Settings v2 | ✅ |
| EV-004 | Inicialización Firebase Admin SDK | ✅ |
| EV-005 | Middleware JWT (`app/core/auth.py`) | ✅ |
| EV-006 | Modelo Pydantic de usuarios (`UserBase`, `UserCreate`, `UserResponse`) | ✅ |
| EV-007 | Servicio Firestore (`app/services/firestore.py`) | ✅ |
| EV-008 | Endpoint `POST /auth/register` | ✅ |
| EV-009 | Endpoints `GET /me`, `GET /health`, `GET /` | ✅ |
| EV-010 | Validación en Swagger UI | ✅ |

---

## Problemas encontrados y soluciones

| Problema | Solución |
|----------|----------|
| `NameError: name 'app' is not defined` | `include_router` estaba antes de `app = FastAPI()` en `main.py` — se reordenó |
| Módulo `email-validator` faltante | Se agregó `pydantic[email]` a `pyproject.toml` vía `uv add` |

---

## Archivos creados
app/
├── core/
│ ├── config.py
│ └── auth.py
├── models/
│ └── user.py
├── services/
│ ├── firebase.py
│ └── firestore.py
├── api/
│ └── auth.py
└── main.py


---

## Resultado

Swagger UI operativo en `/docs` con 4 endpoints funcionales y autenticación JWT integrada. Base lista para Sprint 02.
