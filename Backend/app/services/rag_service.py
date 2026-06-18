import html
import io
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from time import monotonic
from zipfile import BadZipFile, ZipFile

from fastapi import HTTPException, UploadFile, status
from firebase_admin import firestore

from app.core.config import get_settings
from app.models.rag import NO_CONTEXT_RESPONSE
from app.services.storage_service import download_document_bytes, get_extension, upload_document_bytes

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MIME_BY_EXTENSION = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
}


class UserRateLimiter:
    """Rate limiter en memoria por usuario autenticado."""

    def __init__(self):
        self.window_seconds = 60
        self.requests: dict[str, list[float]] = {}

    def check(self, uid: str, limit: int) -> None:
        now = monotonic()
        timestamps = [
            timestamp
            for timestamp in self.requests.get(uid, [])
            if now - timestamp < self.window_seconds
        ]
        if len(timestamps) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Limite de consultas alcanzado. Intenta nuevamente en un minuto.",
            )
        timestamps.append(now)
        self.requests[uid] = timestamps


rag_chat_rate_limiter = UserRateLimiter()
_embedding_model = None
_chroma_client = None
_collection = None


def sanitize_question(value: str) -> str:
    """Elimina HTML y normaliza espacios antes de consultar el indice."""

    without_tags = re.sub(r"<[^>]*>", " ", value)
    return normalize_text(html.unescape(without_tags))


def sanitize_filename(file_name: str) -> str:
    """Normaliza nombres de archivo para evitar rutas y caracteres inseguros."""

    path_name = Path(file_name or "documento").name
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", Path(path_name).stem).strip("._-") or "documento"
    suffix = Path(path_name).suffix.lower()
    return f"{stem[:80]}{suffix}"


def normalize_text(text: str) -> str:
    """Limpia caracteres de control y espacios redundantes."""

    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text or "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Divide texto en chunks por palabra, con overlap para preservar contexto."""

    words = text.split()
    if not words:
        return []
    chunks = []
    step = max(1, chunk_size - overlap)
    for index in range(0, len(words), step):
        chunk = " ".join(words[index:index + chunk_size]).strip()
        if chunk:
            chunks.append(chunk)
    return chunks


def _load_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as error:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Indice semantico no disponible",
            ) from error
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


def _get_collection():
    global _chroma_client, _collection
    if _collection is None:
        try:
            import chromadb
        except ImportError as error:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Indice semantico no disponible",
            ) from error
        settings = get_settings()
        _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        _collection = _chroma_client.get_or_create_collection(
            name="encipharm_docs",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def reset_index_collection() -> None:
    """Recrea la coleccion vectorial local para reindexaciones completas."""

    global _collection
    collection = _get_collection()
    collection_name = collection.name
    _chroma_client.delete_collection(collection_name)
    _collection = _chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )


def add_chunks_to_index(chunks: list[str], metadata: list[dict], doc_id: str) -> None:
    """Genera embeddings y persiste chunks en ChromaDB."""

    if not chunks:
        return
    embeddings = _load_embedding_model().encode(chunks).tolist()
    ids = [f"{doc_id}_chunk_{index}" for index in range(len(chunks))]
    _get_collection().add(documents=chunks, embeddings=embeddings, metadatas=metadata, ids=ids)


def search_similar_chunks(query: str, n_results: int | None = None) -> list[dict]:
    """Busca fragmentos similares y filtra por umbral configurable."""

    settings = get_settings()
    query_embedding = _load_embedding_model().encode([query]).tolist()
    results = _get_collection().query(
        query_embeddings=query_embedding,
        n_results=n_results or settings.MAX_CONTEXT_CHUNKS,
        include=["documents", "metadatas", "distances"],
    )
    documents = results.get("documents") or [[]]
    metadatas = results.get("metadatas") or [[]]
    distances = results.get("distances") or [[]]
    chunks = []
    for index, document in enumerate(documents[0]):
        distance = distances[0][index]
        similarity = 1 - distance
        metadata = metadatas[0][index] or {}
        if similarity >= settings.SIMILARITY_THRESHOLD:
            chunks.append(
                {
                    "texto": document,
                    "documento": metadata.get("documento", ""),
                    "pagina": metadata.get("pagina", ""),
                    "fragmento": document[:500],
                    "similarity": round(similarity, 4),
                }
            )
    return chunks


async def read_upload_bytes(file: UploadFile) -> bytes:
    """Lee el archivo multipart y valida el limite de 20 MB."""

    settings = get_settings()
    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Archivo vacio")
    if len(content) > settings.RAG_MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="El archivo supera el tamano maximo de 20 MB",
        )
    return content


def validate_document_file(file_name: str, content: bytes) -> tuple[str, str]:
    """Valida extension y firma real del archivo antes de procesarlo."""

    extension = get_extension(file_name)
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Formato no permitido")
    if extension == ".pdf" and not content.startswith(b"%PDF"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="El archivo PDF no es valido")
    if extension == ".docx":
        try:
            with ZipFile(io.BytesIO(content)) as archive:
                if "word/document.xml" not in archive.namelist():
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="El archivo DOCX no es valido",
                    )
        except BadZipFile as error:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="El archivo DOCX no es valido",
            ) from error
    if extension == ".txt":
        try:
            content.decode("utf-8")
        except UnicodeDecodeError as error:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="El archivo TXT debe estar codificado en UTF-8",
            ) from error
    return extension, MIME_BY_EXTENSION[extension]


def extract_text_by_page(file_name: str, content: bytes) -> list[tuple[int, str]]:
    """Extrae texto por pagina aproximada segun el formato del documento."""

    extension = get_extension(file_name)
    if extension == ".pdf":
        try:
            from pypdf import PdfReader
        except ImportError as error:
            raise HTTPException(status_code=503, detail="Extractor PDF no disponible") from error
        reader = PdfReader(io.BytesIO(content))
        return [
            (page_index + 1, normalize_text(page.extract_text() or ""))
            for page_index, page in enumerate(reader.pages)
        ]
    if extension == ".docx":
        try:
            from docx import Document
        except ImportError as error:
            raise HTTPException(status_code=503, detail="Extractor DOCX no disponible") from error
        document = Document(io.BytesIO(content))
        text = "\n".join(paragraph.text for paragraph in document.paragraphs)
        return [(1, normalize_text(text))]
    return [(1, normalize_text(content.decode("utf-8")))]


def index_document_content(file_name: str, content: bytes, doc_id: str, user: dict) -> int:
    """Extrae, fragmenta e indexa el contenido documental validado."""

    metadata = []
    chunks = []
    for page, page_text in extract_text_by_page(file_name, content):
        for chunk in chunk_text(page_text):
            chunks.append(chunk)
            metadata.append(
                {
                    "documento": file_name,
                    "pagina": page,
                    "subido_por": user.get("uid", ""),
                    "fecha": datetime.now(timezone.utc).isoformat(),
                }
            )
    add_chunks_to_index(chunks, metadata, doc_id)
    return len(chunks)


def save_conversation_turn(
    db,
    user: dict,
    pregunta: str,
    respuesta: str,
    fuentes: list[dict],
    tokens_usados: int,
    sin_contexto: bool,
    conversacion_id: str | None = None,
) -> str:
    """Persiste pregunta y respuesta en la coleccion chatConversaciones."""

    now = firestore.SERVER_TIMESTAMP
    conversation_id = conversacion_id or str(uuid.uuid4())
    conversation_ref = db.collection("chatConversaciones").document(conversation_id)
    snapshot = conversation_ref.get()
    if snapshot.exists:
        data = snapshot.to_dict()
        if data.get("usuarioId") != user.get("uid") and user.get("rol") == "vendedor":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos para esta conversacion")
        existing_messages = data.get("mensajes", [])
        created_at = data.get("createdAt", now)
    else:
        existing_messages = []
        created_at = now

    messages = [
        *existing_messages,
        {"tipo": "pregunta", "texto": pregunta, "timestamp": now},
        {
            "tipo": "respuesta",
            "texto": respuesta,
            "timestamp": now,
            "fuentes": fuentes,
            "tokens_usados": tokens_usados,
            "sin_contexto": sin_contexto,
        },
    ]
    conversation_ref.set(
        {
            "id": conversation_id,
            "usuarioId": user.get("uid"),
            "usuarioEmail": user.get("email", ""),
            "rol": user.get("rol", "vendedor"),
            "mensajes": messages,
            "createdAt": created_at,
            "updatedAt": now,
        }
    )
    return conversation_id


def register_document(db, doc_id: str, file_name: str, original_name: str, gcs_path: str, chunks: int, size: int, user: dict) -> None:
    """Registra metadatos auditables del documento en Firestore."""

    db.collection("documentosRAG").document(doc_id).set(
        {
            "id": doc_id,
            "nombre": file_name,
            "nombreOriginal": original_name,
            "descripcion": "",
            "gcsPath": gcs_path,
            "chunks_count": chunks,
            "indexadoEn": firestore.SERVER_TIMESTAMP,
            "subidoPor": user.get("uid"),
            "subidoPorEmail": user.get("email", ""),
            "tamano_bytes": size,
            "activo": True,
        }
    )


def list_documents(db) -> list[dict]:
    """Lista documentos RAG activos e inactivos ordenados por fecha."""

    docs = db.collection("documentosRAG").order_by("indexadoEn", direction=firestore.Query.DESCENDING).stream()
    return [doc.to_dict() for doc in docs]


def list_conversations(db, user: dict, limit: int = 50) -> list[dict]:
    """Lista conversaciones segun permisos del rol autenticado."""

    query = db.collection("chatConversaciones").order_by("updatedAt", direction=firestore.Query.DESCENDING).limit(limit)
    if user.get("rol") == "vendedor":
        query = query.where("usuarioId", "==", user.get("uid"))
    return [doc.to_dict() for doc in query.stream()]


def upload_and_index_document(db, file_name: str, content: bytes, content_type: str, user: dict) -> dict:
    """Sube documento a GCS, lo indexa y registra auditoria."""

    doc_id = str(uuid.uuid4())
    safe_name = sanitize_filename(file_name)
    gcs_path = upload_document_bytes(safe_name, content, content_type)
    chunks = index_document_content(safe_name, content, doc_id, user)
    register_document(db, doc_id, safe_name, file_name, gcs_path, chunks, len(content), user)
    return {"documento": safe_name, "chunks_indexados": chunks}


def reindex_documents(db, user: dict) -> int:
    """Reconstruye el indice vectorial desde documentos activos en GCS."""

    reset_index_collection()
    indexed_chunks = 0
    for document in list_documents(db):
        if not document.get("activo", True) or not document.get("gcsPath"):
            continue
        content = download_document_bytes(document["gcsPath"])
        chunks = index_document_content(document["nombre"], content, document["id"], user)
        indexed_chunks += chunks
        db.collection("documentosRAG").document(document["id"]).update(
            {"chunks_count": chunks, "indexadoEn": firestore.SERVER_TIMESTAMP}
        )
    return indexed_chunks


def no_context_payload() -> tuple[str, list[dict], int, bool]:
    """Entrega respuesta local cuando no hay contexto suficiente."""

    return NO_CONTEXT_RESPONSE, [], 0, True
