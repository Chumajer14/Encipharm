# Matriz cumplimiento docs vs repo

| Documento | Afirmacion / criterio | Evidencia en codigo | Estado | Accion requerida | Observacion |
|---|---|---|---|---|---|
| `README.md` | MVP web Enci Ventas | `frontend/`, `Backend/` | Cumple | Actualizado | Reescrito para cierre final. |
| `README.md` | RAG declarado como estado cerrado | `Backend/app/api/rag.py`, `frontend/src/pages/AsistenteEnci.jsx` | Cumple parcial | Corregir documentacion | Ajustado a RAG parcialmente entregado. |
| `README.md` | App vendedor/Flutter | `vendedor-app/`; no existe `mobile/` | Cumple parcial | Corregir documentacion | PWA en repo, Flutter externo parcial. |
| `docs/architecture.md` | RAG estado operativo documentado | Routers y servicios RAG existen | Documentacion debe corregirse | Corregido | Estado cambiado a parcialmente entregado/UAT. |
| `docs/api/rag.md` | Supervisores/admin ven consolidado conversaciones | `list_conversations` filtra por `usuarioId` | Documentacion debe corregirse | Corregido | Historial por usuario. |
| `docs/api/auth.md` | Endpoint temporal de rol | `Backend/app/api/auth.py` | Residual autorizado - no tocar | Mantener | Retiro manual final. |
| `docs/deploy-vercel-frontend.md` | Vercel frontend y variables | `frontend/vercel.json`, `vercel.json` | Cumple | Validar dominio final | Placeholders son ejemplos. |
| `docs/deploy-vercel-vendedor-app.md` | PWA vendedor | `vendedor-app/`, `vendedor-app/vercel.json` | Cumple | Validar URL backend final | No confundir con Flutter. |
| `docs/qa/epic-05-uat-go-live.md` | Readiness y smoke | `Backend/app/core/readiness.py`, `tools/smoke_crm_web.py` | Cumple | Ejecutar en ambiente cliente | Depende de credenciales. |
| `docs/qa/hardening-seguridad.md` | Headers, CORS, rate limit | `Backend/app/main.py`, `core/rate_limit.py` | Cumple | Mantener | Validado por lectura y tests pendientes backend local. |
| `docs/rag-test-corpus/` | Corpus de prueba | Archivos `.txt` y PDFs de corpus | Cumple | No tratar como corpus definitivo | Requiere corpus cliente. |
| `docs/entrega-cliente/*.pdf` | Entrega documental formal | PDFs versionados | Cumple parcial | Mantener como evidencia | Contenido no reescrito; repo alineado con carpeta final. |
