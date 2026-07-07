# API - Enci Chat

Base URL desarrollo: `http://127.0.0.1:8000`

Todos los endpoints requieren:

```http
Authorization: Bearer <firebase_id_token>
```

## Permisos

| Endpoint | Roles |
|----------|-------|
| `POST /rag/chat` | `admin`, `supervisor`, `vendedor` |
| `GET /rag/conversations` | `admin`, `supervisor`, `vendedor` |
| `POST /rag/documents/upload` | `admin` |
| `POST /rag/documents/reindex` | `admin` |
| `GET /rag/documents` | `admin` |

Cada usuario recupera sus propias conversaciones. Supervisores y administradores mantienen acceso a chat y gestion documental segun rol, pero el historial de `/rag/conversations` queda filtrado por `usuarioId`.

## POST `/rag/chat`

Envía una pregunta al asistente documental. La pregunta se sanitiza, se limita a 1000 caracteres y se compara contra el índice semántico antes de invocar el proveedor de generación.

```json
{
  "pregunta": "Cual es la dosificacion del producto X para cerdos?",
  "conversacion_id": "uuid-opcional"
}
```

Respuesta:

```json
{
  "respuesta": "Segun la ficha tecnica...",
  "fuentes": [
    {
      "documento": "ficha_tecnica_productox.pdf",
      "pagina": 3,
      "fragmento": "Texto usado como evidencia"
    }
  ],
  "conversacion_id": "uuid",
  "tokens_usados": 512,
  "timestamp": "2026-06-17T23:00:00Z",
  "diagnostico": {
    "origen": "deepseek",
    "proveedor": "DeepSeek",
    "modelo": "deepseek-chat",
    "fragmentos_documentales": 1,
    "fragmentos_internos": 0
  },
  "titulo_conversacion": "Consulta producto X"
}
```

Si no hay contexto suficiente, la API responde localmente sin invocar el proveedor externo:

```json
{
  "respuesta": "Este asistente esta enfocado en consultas tecnicas, comerciales, documentales y datos internos de Enci.",
  "fuentes": [],
  "tokens_usados": 0
}
```

Controles:

- Rate limit por `uid`: 30 consultas por minuto por defecto.
- Tamaño máximo de `pregunta`: 1000 caracteres.
- No se expone el proveedor ni detalles técnicos en errores 503.
- `diagnostico` se entrega como trazabilidad tecnica de UAT y no contiene secretos.

## POST `/rag/documents/upload`

Carga e indexa documentos internos. Solo administradores.

Formato: `multipart/form-data` con campo `file`.

Formatos aceptados:

- `.pdf`
- `.docx`
- `.txt` UTF-8

Controles:

- Tamaño máximo: 20 MB.
- Validación por extensión y firma/contenido real.
- Nombre sanitizado antes de guardar.
- Registro en `documentosRAG`.
- Chunks y embeddings en índice Chroma local.

Respuesta:

```json
{
  "mensaje": "Documento indexado exitosamente",
  "documento": "ficha_tecnica_productox.pdf",
  "chunks_indexados": 42,
  "disponible_en": "inmediato"
}
```

## POST `/rag/documents/reindex`

Reconstruye el índice semántico desde los documentos activos almacenados.

```json
{
  "mensaje": "Documentos reindexados exitosamente",
  "chunks_indexados": 120
}
```

## GET `/rag/documents`

Lista documentos registrados en `documentosRAG` con metadatos de auditoría.

## GET `/rag/conversations`

Lista conversaciones persistidas en `chatConversaciones`.

Query params:

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `limit` | entero opcional, 1-100 | Limita resultados; default 50 |

## Variables de entorno

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
GCS_BUCKET_DOCUMENTS=encipharm-rag-documents
MAX_TOKENS_RESPONSE=1024
MAX_CONTEXT_CHUNKS=5
SIMILARITY_THRESHOLD=0.65
CHROMA_PERSIST_DIR=./chroma_db
RAG_CHAT_RATE_LIMIT_PER_MINUTE=30
RAG_MAX_UPLOAD_BYTES=20971520
```

`DEEPSEEK_API_KEY` solo debe existir en backend. No debe exponerse en archivos frontend ni variables `VITE_*`.
