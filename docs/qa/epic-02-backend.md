# QA - EPIC 2 Backend

**Fecha:** 2 mayo 2026

**Rama:** `feature/backend-users-roles`

**Alcance:** backend de usuarios/roles, clientes, importacion CSV y dashboard base.

## Estrategia

Se agregaron pruebas automatizadas con `pytest` y `TestClient` de FastAPI. Las pruebas usan dobles en memoria para Firestore y Firebase Auth, evitando dependencia de servicios externos durante QA local.

## Comandos ejecutados

```bash
cd Backend
uv sync
uv run pytest
```

## Resultado

```text
13 passed
```

## Cobertura funcional

| Area | Caso | Resultado |
|------|------|-----------|
| Smoke API | `/health` responde en ambiente testing | OK |
| Auth | Endpoints protegidos rechazan requests sin token | OK |
| Usuarios | Supervisor/admin listan usuarios activos | OK |
| Usuarios | Admin cambia rol de usuario | OK |
| Usuarios | Vendedor no puede cambiar roles | OK |
| Clientes | Vendedor crea cliente asignado a su UID | OK |
| Clientes | Listado de vendedor queda limitado a sus clientes | OK |
| Clientes | Importacion CSV valida filas y guarda registros validos | OK |
| Clientes | CSV invalido reporta fila y no guarda registros | OK |
| Clientes | Vendedor no puede importar CSV | OK |
| Dashboard | Dashboard vendedor cuenta solo clientes propios | OK |
| Dashboard | Dashboard supervisor consolida todos los clientes | OK |

## Riesgos residuales

- Falta prueba E2E contra un proyecto Firebase/Firestore real.
- Falta integracion frontend con estos endpoints.
- Falta CI remoto para ejecutar `uv run pytest` en cada PR.
- Las metricas de dashboard son base CRM; pipeline, propuestas e interacciones entran en EPIC 3.

## Recomendacion QA

Antes de cerrar UAT, ejecutar una prueba manual en Swagger con:

1. Token Firebase real de usuario `admin`.
2. Token Firebase real de usuario `supervisor`.
3. Token Firebase real de usuario `vendedor`.
4. CSV con filas validas e invalidas.
5. Verificacion posterior en Firestore de colecciones `users` y `clientes`.
