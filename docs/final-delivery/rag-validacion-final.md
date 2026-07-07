# Validacion final RAG

## Estado tecnico

RAG esta parcialmente entregado y preparado para UAT controlado. Existe backend funcional para chat, historial, carga documental, reindexacion y listado documental. La experiencia web y la PWA consumen `/rag/chat` con Bearer token.

## Alcance parcial

- Respuestas con DeepSeek cuando hay chunks recuperados.
- Fallback local cuando no hay contexto suficiente.
- Contexto documental desde Chroma.
- Contexto interno CRM para clientes, usuarios, oportunidades, propuestas e interacciones segun rol.
- Conversaciones persistidas por usuario en `chatConversaciones`.
- Documentos registrados en `documentosRAG`.
- Upload/reindex/listado restringidos a `admin`.

No se declara IA completa, SLA productivo, fine-tuning, evaluacion masiva ni corpus definitivo.

## Endpoints

| Endpoint | Estado | Restriccion |
|---|---|---|
| `POST /rag/chat` | Existe | `vendedor` o superior, rate limit por UID. |
| `GET /rag/conversations` | Existe | Historial del usuario autenticado. |
| `POST /rag/documents/upload` | Existe | Solo `admin`, max 20 MB. |
| `POST /rag/documents/reindex` | Existe | Solo `admin`. |
| `GET /rag/documents` | Existe | Solo `admin`. |

## Variables

| Variable | Uso | Riesgo |
|---|---|---|
| `DEEPSEEK_API_KEY` | LLM backend | Debe existir solo en backend. |
| `DEEPSEEK_BASE_URL` | Endpoint proveedor | Debe ser HTTPS. |
| `DEEPSEEK_MODEL` | Modelo | Confirmar costo/limites. |
| `CHROMA_PERSIST_DIR` | Indice local | No tratar como almacenamiento productivo definitivo sin persistencia controlada. |
| `GCS_BUCKET_DOCUMENTS` | Storage docs | Requiere bucket cliente. |
| `LOCAL_DOCUMENT_STORAGE_DIR` | Fallback local | No versionar. |
| `RAG_CHAT_RATE_LIMIT_PER_MINUTE` | Limite chat | Ajustar en UAT. |
| `RAG_MAX_UPLOAD_BYTES` | Limite upload | Default 20 MB. |

## Riesgos residuales

- DeepSeek depende de API key, disponibilidad, costos y politica del proveedor.
- Corpus real debe ser entregado/validado por cliente.
- Chroma local requiere estrategia de persistencia en produccion.
- GCS requiere bucket y permisos.
- Calidad de respuestas requiere UAT con preguntas reales.

## Criterios de aceptacion UAT

- Chat autenticado responde con contexto para preguntas del corpus.
- Chat sin contexto responde localmente sin inventar fuentes.
- Fuentes incluyen documento, pagina y fragmento.
- Vendedor no accede a datos ajenos.
- Upload/reindex/listado quedan restringidos a admin.
- `DEEPSEEK_API_KEY` no aparece en frontend ni archivos versionados.

## Fuera de alcance

Tuning avanzado, fine-tuning, evaluacion masiva, SLA proveedor, cambio de proveedor, corpus definitivo no entregado por cliente, analitica IA avanzada y almacenamiento productivo definitivo sin configuracion cliente.
