# Setup — Encipharm Ventas Backend

## Requisitos previos

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) instalado globalmente
- Cuenta de Firebase con proyecto configurado
- Archivo `serviceAccountKey.json` (solicitar al líder técnico)

## Clonar el repositorio

```bash
git clone https://github.com/tu-org/Encipharm.git
cd Encipharm/Backend
```

## Instalar dependencias

```bash
uv sync
```

## Variables de entorno

Crea un archivo `.env` en `Backend/` basado en `.env.example`:

```env
APP_NAME=Encipharm Ventas
APP_ENV=development
FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json
```

## Levantar el servidor

```bash
uv run uvicorn app.main:app --reload
```

El servidor queda disponible en:
- API: http://127.0.0.1:8000
- Swagger UI: http://127.0.0.1:8000/docs

## Verificar que funciona

Abre el navegador en `/docs` y confirma que aparecen los endpoints:

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Root |
| GET | `/health` | Estado del servidor |
| GET | `/me` | Usuario autenticado (JWT requerido) |
| POST | `/auth/register` | Registro de nuevo usuario |

## Ramas de trabajo

| Rama | Propósito |
|------|-----------|
| `main` | Producción estable |
| `develop` | Integración |
| `feature/*` | Desarrollo por módulo |