# Inventario final del repositorio

| Ruta | Tipo | Estado | Uso actual | Riesgo | Accion recomendada |
|---|---|---|---|---|---|
| `/` | Raiz | Mantener | Monorepo Enci Ventas | Bajo | Mantener estructura. |
| `.gitignore` | Config | Actualizar | Reglas de no versionado | Medio si faltan PWA/backups | Actualizado para PWA, backups y artefactos. |
| `.gitattributes` | Config | Mantener | Normalizacion Git | Bajo | Mantener. |
| `.vercelignore` | Config | Mantener | Deploy Vercel | Bajo | Mantener. |
| `README.md` | Documentacion | Actualizar | Presentacion repo | Alto si promete alcance falso | Reescrito con RAG parcial, PWA y Flutter externo. |
| `firebase.json` | Firebase | Mantener | Apunta a `firestore.rules` | Bajo | Mantener. |
| `firestore.rules` | Seguridad | Mantener | Deny-all Firestore cliente | Bajo | Mantener y validar en Firebase Console. |
| `vercel.json` | Deploy | Mantener | Build frontend web | Bajo | Mantener. |
| `iniciar-enci-local.bat` | Operacion local | Mantener | Arranque backend, frontend y PWA | Bajo | Mantener como apoyo local. |
| `Backend/` | Backend | Mantener | API FastAPI | Medio por credenciales externas | Mantener y validar con `uv` disponible. |
| `Backend/app/main.py` | Backend | Mantener | App, CORS, headers, rate limit, routers | Bajo | Mantener. |
| `Backend/app/api/` | Backend routers | Mantener | Auth, clientes, comercial, dashboard, users, competencia, RAG | Bajo | Mantener. |
| `Backend/app/api/auth.py` | Backend router | Residual autorizado - no tocar | Endpoint temporal `/auth/temporary-role` | Medio/alto si queda activo en produccion | Mantener por instruccion; apagar en ambientes desplegados. |
| `Backend/app/api/rag.py` | Backend router | Actualizar | RAG chat/docs | Bajo | Retirada referencia temporal en comentario, sin cambiar API. |
| `Backend/app/models/` | Backend modelos | Actualizar | Schemas Pydantic | Bajo | `RagResponseDiagnostics` queda como trazabilidad UAT. |
| `Backend/app/services/` | Backend servicios | Mantener | Firestore, negocio, RAG, LLM, storage | Medio por dependencias externas | Mantener y validar con credenciales. |
| `Backend/app/core/` | Backend core | Mantener | Config, auth, readiness, errores, headers, limits | Bajo | Mantener. |
| `Backend/tests/` | Tests | Mantener | Pytest backend | Medio por tooling local ausente | Ejecutar en entorno con `uv`/pytest. |
| `Backend/.env.example` | Ejemplo env | Mantener | Variables documentales | Bajo | Mantener placeholders, no secretos. |
| `Backend/uv.lock` | Lock Python | Mantener | Reproducibilidad uv | Bajo | Mantener. |
| `frontend/` | Frontend web | Mantener | CRM React/Vite | Bajo | Mantener; lint/build pasan. |
| `frontend/src/components/TemporaryRoleSwitcher.jsx` | Frontend | Residual autorizado - no tocar | Barra temporal rol | Medio/alto si queda para produccion | Sin cambios por instruccion. |
| `frontend/src/auth/ProtectedRoute.jsx` | Frontend | Residual autorizado - no tocar | Render condicional barra temporal | Medio | Sin cambios por instruccion. |
| `frontend/src/pages/AsistenteEnci.jsx` | Frontend | Actualizar | Enci Chat web | Bajo | Retirada leyenda diagnostica temporal visible. |
| `frontend/src/components/rag/ChatMessage.jsx` | Frontend | Actualizar | Mensajes Enci Chat | Bajo | Retirado indicador visual temporal de origen RAG. |
| `frontend/package*.json` | Dependencias | Mantener | Scripts y lock | Bajo | Mantener; audit 0 vulnerabilidades. |
| `frontend/dist/` | Artefacto local | No versionar | Build local ignorado | Bajo | No incluir en commit. |
| `frontend/node_modules/` | Dependencias locales | No versionar | Instalacion local ignorada | Bajo | No incluir en commit. |
| `vendedor-app/` | PWA | Mantener | App Vendedor React/Vite | Medio por alcance Flutter | Documentar como PWA, no Flutter. |
| `vendedor-app/package-lock.json` | Lock PWA | Actualizar | Dependencias PWA | Medio por audit | Actualizado con `npm audit fix`. |
| `vendedor-app/api/[...path].js` | Proxy | Mantener | Proxy Vercel `/api` | Medio por URL backend fija | Validar URL final en despliegue. |
| `vendedor-app/src/db/dexie.js` | PWA local | Mantener | Persistencia local de cotizaciones | Medio si se promete offline total | Documentar como apoyo, no offline total. |
| `docs/` | Documentacion | Actualizar | Arquitectura, API, QA, deploy, entrega | Medio por contradicciones | Correcciones puntuales y carpeta final. |
| `docs/entrega-cliente/*.pdf` | Documentos cliente | Mantener | Evidencia historica/formal | Bajo | Mantener. |
| `docs/rag-test-corpus/` | Corpus prueba | Mantener | Corpus RAG de prueba | Medio si se confunde con corpus definitivo | Documentar como prueba. |
| `tools/` | Scripts | Mantener | Smoke y generacion PDFs | Bajo | Mantener. |
| `mobile/` | Carpeta inexistente | No aplica | Flutter no esta en repo | Bajo | Declarar Flutter externo parcial. |
| `chroma_db/` | Artefacto local | No versionar | Indice vectorial local | Alto si contiene datos | Ignorado; no versionado. |
| `document_storage/` | Artefacto local | No versionar | Storage documental local | Alto si contiene documentos | Ignorado; no versionado. |
| `.env`, `.env.*` | Secretos locales | No versionar | Variables reales | Alto | Ignorados salvo `.env.example`. |
| `serviceAccountKey.json` | Secreto | No versionar | Credencial Firebase Admin | Critico | Ignorado; no versionado. |
