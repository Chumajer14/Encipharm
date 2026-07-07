# Resultados validacion final

Fecha/hora auditoria: 2026-07-07.

| Comando | Resultado | Errores corregidos | Errores pendientes | Justificacion |
|---|---|---|---|---|
| `cd Backend && uv sync` | No ejecutado: `uv` no esta disponible en PATH | Ninguno | Instalar `uv` o usar entorno CI | Bloqueo de herramienta local, no de codigo. |
| `cd Backend && uv run pytest` | No ejecutado: `uv` no esta disponible en PATH | Ninguno | Ejecutar en entorno con `uv` | Bloqueo de herramienta local. |
| `cd Backend && python -m pytest` | Falla: `No module named pytest` | Ninguno | Instalar dependencias dev | Python global 3.14 no tiene pytest; repo requiere 3.12+ con `uv`. |
| `cd frontend && npm ci` | OK, 0 vulnerabilidades | N/A | Ninguno | Dependencias instaladas. |
| `cd frontend && npm run test -- --runInBand` | Falla: Vitest no reconoce `--runInBand` | Se reintento con el script correcto | Ninguno | Opcion propia de Jest, no Vitest. |
| `cd frontend && npm run test` | OK, 6 archivos / 30 tests passed | Tests RAG actualizados para no esperar indicador diagnostico visible | Ninguno | Suite frontend en verde. |
| `cd frontend && npm run lint` | OK | N/A | Ninguno | ESLint sin errores. |
| `cd frontend && npm run build` | OK | N/A | Ninguno | Build Vite exitoso. |
| `cd frontend && npm audit --audit-level=moderate` | OK, 0 vulnerabilidades | N/A | Ninguno | Audit limpio. |
| `cd vendedor-app && npm ci` | OK con 1 vulnerabilidad moderada inicial | `npm audit fix` | Ninguno | Vulnerabilidad transitoria en `protobufjs`. |
| `cd vendedor-app && npm audit --audit-level=moderate` | OK tras fix, 0 vulnerabilidades | Actualizado lockfile | Ninguno | Audit limpio. |
| `cd vendedor-app && npm run lint` | OK | N/A | Ninguno | ESLint sin errores. |
| `cd vendedor-app && npm run build` | OK | N/A | Ninguno | Build Vite exitoso. |
| `python -m py_compile tools/build_audit_pdf.py` | OK | Texto residual de estado RAG actualizado | Ninguno | Script compila correctamente. |
| `git status` / `git diff --stat` | Ejecutado durante auditoria | N/A | Revisar antes de commit | Cambios esperados en docs, README, gitignore, RAG y lock PWA. |

## Confirmaciones

- La barra temporal de test no fue modificada.
- No se versionaron secretos.
- No se incluyeron `.env` reales, service accounts, Chroma DB local, storage documental local, `node_modules` ni `dist`.
