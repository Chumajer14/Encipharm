from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.concurrency import run_in_threadpool

from app.core.auth import require_role
from app.core.config import get_settings
from app.models.rag import (
    RagChatRequest,
    RagChatResponse,
    RagConversationResponse,
    RagDocumentResponse,
    RagSource,
    RagUploadResponse,
)
from app.services.firestore import get_db
from app.services.llm_service import build_system_prompt, build_user_prompt, call_deepseek
from app.services.rag_service import (
    build_internal_context_chunks,
    list_conversations,
    list_documents,
    no_context_payload,
    rag_chat_rate_limiter,
    read_upload_bytes,
    reindex_documents,
    sanitize_question,
    save_conversation_turn,
    search_similar_chunks,
    upload_and_index_document,
    validate_document_file,
)

router = APIRouter(prefix="/rag", tags=["RAG"])


@router.post("/chat", response_model=RagChatResponse)
async def chat_with_rag(
    payload: RagChatRequest,
    user: dict = Depends(require_role("vendedor")),
):
    """Responde preguntas usando exclusivamente fragmentos recuperados del corpus interno."""

    settings = get_settings()
    rag_chat_rate_limiter.check(user["uid"], settings.RAG_CHAT_RATE_LIMIT_PER_MINUTE)
    pregunta = sanitize_question(payload.pregunta)
    if not pregunta:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="La pregunta no puede estar vacia")

    db = get_db()
    internal_chunks = await run_in_threadpool(
        build_internal_context_chunks,
        db,
        pregunta,
        user,
        settings.MAX_CONTEXT_CHUNKS * 3,
    )
    document_chunks = await run_in_threadpool(search_similar_chunks, pregunta, settings.MAX_CONTEXT_CHUNKS)
    chunks = [*internal_chunks, *document_chunks]

    if chunks:
        llm_response = await call_deepseek(build_system_prompt(), build_user_prompt(pregunta, chunks))
        respuesta = llm_response["texto"]
        tokens_usados = llm_response["tokens"]
        fuentes = [
            {
                "documento": chunk["documento"],
                "pagina": chunk.get("pagina"),
                "fragmento": chunk.get("fragmento") or chunk["texto"][:500],
            }
            for chunk in chunks
        ]
        sin_contexto = False
    else:
        respuesta, fuentes, tokens_usados, sin_contexto = no_context_payload()

    conversation_id = await run_in_threadpool(
        save_conversation_turn,
        db,
        user,
        pregunta,
        respuesta,
        fuentes,
        tokens_usados,
        sin_contexto,
        payload.conversacion_id,
    )

    return RagChatResponse(
        respuesta=respuesta,
        fuentes=[RagSource(**source) for source in fuentes],
        conversacion_id=conversation_id,
        tokens_usados=tokens_usados,
        timestamp=datetime.now(timezone.utc),
    )


@router.get("/conversations", response_model=list[RagConversationResponse])
async def get_rag_conversations(
    limit: int = Query(default=50, ge=1, le=100),
    user: dict = Depends(require_role("vendedor")),
):
    """Lista conversaciones RAG segun alcance de rol."""

    return await run_in_threadpool(list_conversations, get_db(), user, limit)


@router.post("/documents/upload", response_model=RagUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_rag_document(
    file: UploadFile = File(...),
    user: dict = Depends(require_role("admin")),
):
    """Carga un documento validado, lo guarda en GCS y lo indexa para busqueda semantica."""

    content = await read_upload_bytes(file)
    _extension, content_type = validate_document_file(file.filename or "", content)
    result = await run_in_threadpool(
        upload_and_index_document,
        get_db(),
        file.filename or "documento",
        content,
        content_type,
        user,
    )
    return RagUploadResponse(mensaje="Documento indexado exitosamente", **result)


@router.post("/documents/reindex")
async def reindex_rag_documents(user: dict = Depends(require_role("admin"))):
    """Reconstruye el indice vectorial desde los documentos activos almacenados."""

    chunks = await run_in_threadpool(reindex_documents, get_db(), user)
    return {"mensaje": "Documentos reindexados exitosamente", "chunks_indexados": chunks}


@router.get("/documents", response_model=list[RagDocumentResponse])
async def get_rag_documents(user: dict = Depends(require_role("admin"))):
    """Lista documentos disponibles en el corpus RAG."""

    return await run_in_threadpool(list_documents, get_db())
