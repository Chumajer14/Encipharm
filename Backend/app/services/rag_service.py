import html
import io
import re
import unicodedata
import uuid
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from time import monotonic
from typing import Any
from zipfile import BadZipFile, ZipFile

from fastapi import HTTPException, UploadFile, status
from firebase_admin import firestore

from app.core.config import get_settings
from app.models.rag import NO_CONTEXT_RESPONSE
from app.services.clientes import list_clientes
from app.services.comercial import list_interactions, list_opportunities, list_proposals
from app.services.dashboard import build_dashboard
from app.services.storage_service import download_document_bytes, get_extension, upload_document_bytes
from app.services.users import list_users

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MIME_BY_EXTENSION = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
}
STOPWORDS = {
    "a",
    "al",
    "algo",
    "como",
    "con",
    "cual",
    "cuales",
    "cuando",
    "de",
    "del",
    "dime",
    "donde",
    "el",
    "en",
    "es",
    "esta",
    "estan",
    "hay",
    "la",
    "las",
    "lo",
    "los",
    "me",
    "muestra",
    "para",
    "por",
    "que",
    "quien",
    "quienes",
    "son",
    "su",
    "sus",
    "todos",
    "todas",
    "un",
    "una",
    "y",
}
INTERNAL_DATA_TERMS = {
    "cliente",
    "clientes",
    "contacto",
    "crm",
    "firebase",
    "forecast",
    "interaccion",
    "interacciones",
    "llamada",
    "oportunidad",
    "oportunidades",
    "pipeline",
    "propuesta",
    "propuestas",
    "reunion",
    "seguimiento",
    "usuario",
    "usuarios",
    "vendedor",
    "vendedores",
    "venta",
    "ventas",
}
CONVERSATIONAL_QUESTIONS = {
    "adios",
    "buenas",
    "buenas noches",
    "buenas tardes",
    "buenos dias",
    "chao",
    "como estas",
    "como te encuentras",
    "gracias",
    "hasta luego",
    "hola",
    "hola como estas",
    "muchas gracias",
    "necesito ayuda",
    "saludos",
    "tengo una duda",
    "tengo una pregunta",
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


def _tokens(value: str) -> set[str]:
    value = "".join(
        character
        for character in unicodedata.normalize("NFKD", value)
        if not unicodedata.combining(character)
    )
    words = re.findall(r"[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]{3,}", value.lower())
    return {word for word in words if word not in STOPWORDS}


def _safe_value(value: Any) -> str:
    if value is None:
        return "N/D"
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def _source(documento: str, pagina: str, text: str) -> dict:
    clean_text = normalize_text(text)
    return {
        "texto": clean_text,
        "documento": documento,
        "pagina": pagina,
        "fragmento": clean_text[:500],
    }


def _score_chunk(question_tokens: set[str], chunk: dict) -> int:
    chunk_tokens = _tokens(f"{chunk.get('documento', '')} {chunk.get('pagina', '')} {chunk.get('texto', '')}")
    return len(question_tokens & chunk_tokens)


def _count_by(items: list[dict], key: str) -> str:
    counter = Counter(_safe_value(item.get(key)) for item in items)
    if not counter:
        return "sin registros"
    return ", ".join(f"{name}: {total}" for name, total in counter.most_common(8))


def _format_user(user: dict) -> str:
    return (
        f"Usuario: {user.get('nombre')} | rol: {user.get('rol')} | "
        f"cargo: {user.get('cargo')} | rango: {user.get('rango')} | zona: {user.get('zona')} | "
        f"activo: {user.get('activo')} | webApp: {user.get('webApp')} | appMovil: {user.get('appMovil')}"
    )


def _format_cliente(cliente: dict) -> str:
    return (
        f"Cliente: {cliente.get('nombre')} | empresa: {cliente.get('empresa')} | "
        f"rubro: {cliente.get('rubro')} | region: {cliente.get('region')} | estado: {cliente.get('estado')}"
    )


def _format_opportunity(opportunity: dict, client_name: str) -> str:
    return (
        f"Oportunidad: {opportunity.get('titulo')} | cliente: {client_name} | "
        f"etapa: {opportunity.get('etapa')} | valorEstimado: {opportunity.get('valorEstimado')} | "
        f"probabilidad: {opportunity.get('probabilidad')}"
    )


def _format_proposal(proposal: dict, client_name: str, opportunity_name: str) -> str:
    return (
        f"Propuesta: {proposal.get('titulo')} | cliente: {client_name} | "
        f"oportunidad: {opportunity_name} | estado: {proposal.get('estado')} | "
        f"montoNeto: {proposal.get('montoNeto')} | montoTotal: {proposal.get('montoTotal')} | "
        f"descuentoPct: {proposal.get('descuentoPct')}"
    )


def _format_interaction(interaction: dict, client_name: str) -> str:
    return (
        f"Interaccion: {interaction.get('tipo')} | cliente: {client_name} | "
        f"fecha: {_safe_value(interaction.get('fecha'))} | resumen: {interaction.get('resumen')} | "
        f"resultado: {interaction.get('resultado')} | proximaAccion: {interaction.get('proximaAccion')}"
    )


def is_internal_data_question(question: str) -> bool:
    """Detecta consultas que requieren datos comerciales internos y Firestore."""

    return bool(_tokens(question) & INTERNAL_DATA_TERMS)


def is_conversational_question(question: str) -> bool:
    """Detecta frases cotidianas breves que no requieren recuperar fuentes."""

    normalized = "".join(
        character
        for character in unicodedata.normalize("NFKD", question.lower())
        if not unicodedata.combining(character)
    )
    normalized = re.sub(r"[^a-z0-9 ]+", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized in CONVERSATIONAL_QUESTIONS


def select_context_chunks(
    question: str,
    internal_chunks: list[dict],
    document_chunks: list[dict],
    limit: int,
) -> list[dict]:
    """Prioriza corpus o datos internos segun la intencion de la consulta."""

    if is_internal_data_question(question):
        return [*internal_chunks, *document_chunks][: limit * 2]
    if document_chunks:
        return document_chunks[:limit]
    return internal_chunks[:limit]


def build_internal_context_chunks(db, question: str, user: dict, limit: int = 16) -> list[dict]:
    """Construye contexto corporativo visible para responder preguntas internas amplias."""

    vendedor_uid = user.get("uid") if user.get("rol") == "vendedor" else None
    clientes = list_clientes(db, vendedor_uid=vendedor_uid, limit=120)
    opportunities = list_opportunities(db, user=user, limit=120)
    proposals = list_proposals(db, user=user, limit=120)
    interactions = list_interactions(db, user=user, limit=80)
    dashboard = build_dashboard(db, vendedor_uid=vendedor_uid)
    client_names = {
        cliente.get("id"): cliente.get("nombre") or cliente.get("empresa") or "Cliente no identificado"
        for cliente in clientes
    }
    opportunity_names = {
        opportunity.get("id"): opportunity.get("titulo") or "Oportunidad no identificada"
        for opportunity in opportunities
    }

    chunks = [
        _source(
            "CRM metricas",
            "dashboard",
            "Metricas internas: "
            + "; ".join(
                f"{key}: {value}"
                for key, value in dashboard.items()
                if key not in {"forecastMensual", "embudoVentas"}
            ),
        ),
        _source(
            "CRM clientes",
            "resumen",
            f"Total clientes visibles: {len(clientes)}. Por estado: {_count_by(clientes, 'estado')}. "
            f"Por region: {_count_by(clientes, 'region')}. Por rubro: {_count_by(clientes, 'rubro')}.",
        ),
        _source(
            "CRM oportunidades",
            "resumen",
            f"Total oportunidades visibles: {len(opportunities)}. Por etapa: {_count_by(opportunities, 'etapa')}.",
        ),
        _source(
            "CRM propuestas",
            "resumen",
            f"Total propuestas visibles: {len(proposals)}. Por estado: {_count_by(proposals, 'estado')}.",
        ),
    ]

    if user.get("rol") in {"supervisor", "admin"}:
        users = list_users(db, activo=None, limit=500)
        chunks.append(
            _source(
                "CRM usuarios",
                "resumen",
                f"Total usuarios registrados: {len(users)}. Por rol: {_count_by(users, 'rol')}. "
                f"Por zona: {_count_by(users, 'zona')}.",
            )
        )
        chunks.extend(
            _source("CRM usuarios", crm_user.get("nombre") or "usuario", _format_user(crm_user))
            for crm_user in users
        )
    else:
        chunks.append(_source("CRM usuarios", user.get("nombre") or "usuario actual", _format_user(user)))

    chunks.extend(
        _source("CRM clientes", cliente.get("nombre") or cliente.get("empresa") or "cliente", _format_cliente(cliente))
        for cliente in clientes
    )
    chunks.extend(
        _source(
            "CRM oportunidades",
            opportunity.get("titulo") or "oportunidad",
            _format_opportunity(
                opportunity,
                client_names.get(opportunity.get("clienteId"), "Cliente no identificado"),
            ),
        )
        for opportunity in opportunities
    )
    chunks.extend(
        _source(
            "CRM propuestas",
            proposal.get("titulo") or "propuesta",
            _format_proposal(
                proposal,
                client_names.get(proposal.get("clienteId"), "Cliente no identificado"),
                opportunity_names.get(proposal.get("oportunidadId"), "Oportunidad no identificada"),
            ),
        )
        for proposal in proposals
    )
    chunks.extend(
        _source(
            "CRM interacciones",
            f"{interaction.get('tipo') or 'interaccion'} con "
            f"{client_names.get(interaction.get('clienteId'), 'cliente no identificado')}",
            _format_interaction(
                interaction,
                client_names.get(interaction.get("clienteId"), "Cliente no identificado"),
            ),
        )
        for interaction in interactions
    )

    question_tokens = _tokens(question)
    if not question_tokens:
        return chunks[:limit]

    scored = [(_score_chunk(question_tokens, chunk), index, chunk) for index, chunk in enumerate(chunks)]
    minimum_score = 1 if is_internal_data_question(question) else 2
    relevant = [item for item in scored if item[0] >= minimum_score]
    if not relevant:
        return []

    relevant.sort(key=lambda item: (item[0], -item[1]), reverse=True)
    return [chunk for _score, _index, chunk in relevant[:limit]]


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
    """Combina similitud semantica y coincidencias lexicas para recuperar documentos."""

    settings = get_settings()
    try:
        collection = _get_collection()
    except HTTPException:
        return []
    if collection.count() == 0:
        return []

    try:
        query_embedding = _load_embedding_model().encode([query]).tolist()
    except HTTPException:
        return []
    result_limit = n_results or settings.MAX_CONTEXT_CHUNKS
    candidate_limit = min(collection.count(), max(result_limit * 4, 20))
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=candidate_limit,
        include=["documents", "metadatas", "distances"],
    )
    documents = results.get("documents") or [[]]
    metadatas = results.get("metadatas") or [[]]
    distances = results.get("distances") or [[]]
    query_tokens = _tokens(query)
    candidates = []
    for index, document in enumerate(documents[0]):
        distance = distances[0][index]
        similarity = 1 - distance
        metadata = metadatas[0][index] or {}
        document_name = metadata.get("documento", "")
        name_tokens = _tokens(document_name)
        content_tokens = _tokens(document)
        token_count = max(1, len(query_tokens))
        name_coverage = len(query_tokens & name_tokens) / token_count
        content_coverage = len(query_tokens & content_tokens) / token_count
        hybrid_score = similarity + (name_coverage * 0.45) + (content_coverage * 0.15)
        if (
            similarity >= settings.SIMILARITY_THRESHOLD
            or name_coverage > 0
            or content_coverage >= 0.5
        ):
            candidates.append(
                {
                    "texto": document,
                    "documento": document_name,
                    "pagina": metadata.get("pagina", ""),
                    "fragmento": document[:500],
                    "similarity": round(similarity, 4),
                    "hybrid_score": round(hybrid_score, 4),
                }
            )

    if not candidates:
        return []

    candidates.sort(key=lambda chunk: chunk["hybrid_score"], reverse=True)
    relevance_floor = candidates[0]["hybrid_score"] - 0.25
    unique_chunks = []
    seen = set()
    for candidate in candidates:
        if candidate["hybrid_score"] < relevance_floor:
            continue
        deduplication_key = (
            candidate["documento"],
            candidate["pagina"],
            normalize_text(candidate["texto"]).lower(),
        )
        if deduplication_key in seen:
            continue
        seen.add(deduplication_key)
        candidate.pop("hybrid_score")
        unique_chunks.append(candidate)
        if len(unique_chunks) >= result_limit:
            break
    return unique_chunks


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
    diagnostico: dict | None = None,
    conversacion_id: str | None = None,
    titulo: str | None = None,
) -> str:
    """Persiste pregunta y respuesta en la coleccion chatConversaciones."""

    now = firestore.SERVER_TIMESTAMP
    message_timestamp = datetime.now(timezone.utc)
    conversation_id = conversacion_id or str(uuid.uuid4())
    conversation_ref = db.collection("chatConversaciones").document(conversation_id)
    snapshot = conversation_ref.get()
    if snapshot.exists:
        data = snapshot.to_dict()
        if data.get("usuarioId") != user.get("uid"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sin permisos para esta conversacion")
        existing_messages = data.get("mensajes", [])
        created_at = data.get("createdAt", now)
        conversation_title = data.get("titulo") or titulo
    else:
        existing_messages = []
        created_at = now
        conversation_title = titulo

    messages = [
        *existing_messages,
        {"tipo": "pregunta", "texto": pregunta, "timestamp": message_timestamp},
        {
            "tipo": "respuesta",
            "texto": respuesta,
            "timestamp": message_timestamp,
            "fuentes": fuentes,
            "tokens_usados": tokens_usados,
            "sin_contexto": sin_contexto,
            "diagnostico": diagnostico,
        },
    ]
    conversation_ref.set(
        {
            "id": conversation_id,
            "usuarioId": user.get("uid"),
            "usuarioEmail": user.get("email", ""),
            "rol": user.get("rol", "vendedor"),
            "titulo": conversation_title,
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
    """Lista exclusivamente las conversaciones pertenecientes a la cuenta autenticada."""

    query = db.collection("chatConversaciones").where("usuarioId", "==", user.get("uid"))
    conversations = [doc.to_dict() for doc in query.stream()]
    conversations.sort(
        key=lambda conversation: conversation.get("updatedAt") or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    return conversations[:limit]


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


def no_context_payload(question: str = "") -> tuple[str, list[dict], int, bool]:
    """Responde interacciones cotidianas y orienta consultas fuera del alcance del asistente."""

    normalized_question = "".join(
        character
        for character in unicodedata.normalize("NFKD", question.lower())
        if not unicodedata.combining(character)
    )
    tokens = _tokens(question)
    if "como estas" in normalized_question or "como te encuentras" in normalized_question:
        response = (
            "Estoy bien y listo para ayudarte. Mi funcion es responder consultas tecnicas y comerciales de Enci, "
            "incluyendo el corpus documental y los datos internos disponibles para tu cuenta."
        )
    elif tokens & {"hola", "buenas", "saludos"}:
        response = (
            "Hola. Soy el Asistente Enci y estoy listo para ayudarte. "
            "Puedes consultarme sobre productos, documentos, sanidad animal, clientes, oportunidades e interacciones."
        )
    elif tokens & {"duda", "pregunta", "ayuda", "consultar"}:
        response = (
            "Claro, escribe tu duda con tus propias palabras. Puedes preguntar, por ejemplo, por un producto, "
            "una norma sanitaria, un cliente, una oportunidad o la ultima interaccion registrada."
        )
    elif tokens & {"gracias", "agradecido", "agradecida"}:
        response = "De nada. Cuando quieras, puedes hacer otra consulta tecnica o comercial sobre Enci."
    elif tokens & {"adios", "chao", "hasta", "luego"}:
        response = "Hasta luego. Quedo disponible para tus proximas consultas tecnicas o comerciales de Enci."
    else:
        response = NO_CONTEXT_RESPONSE
    return response, [], 0, True
