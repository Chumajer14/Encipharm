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
    RagResponseDiagnostics,
    RagSource,
    RagUploadResponse,
)
from app.services.firestore import get_db
from app.services.llm_service import (
    build_system_prompt,
    build_user_prompt,
    call_deepseek,
    generate_conversation_title,
    generate_conversation_titles,
    normalize_conversation_title,
)
from app.services.rag_service import (
    build_internal_context_chunks,
    is_conversational_question,
    is_internal_data_question,
    list_conversations,
    list_documents,
    no_context_payload,
    rag_chat_rate_limiter,
    read_upload_bytes,
    reindex_documents,
    sanitize_question,
    save_conversation_turn,
    search_similar_chunks,
    select_context_chunks,
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
    conversational_question = is_conversational_question(pregunta)
    document_chunks = [] if conversational_question else await run_in_threadpool(
        search_similar_chunks,
        pregunta,
        settings.MAX_CONTEXT_CHUNKS,
    )
    internal_chunks = []
    if not conversational_question and (is_internal_data_question(pregunta) or not document_chunks):
        internal_chunks = await run_in_threadpool(
            build_internal_context_chunks,
            db,
            pregunta,
            user,
            settings.MAX_CONTEXT_CHUNKS * 3,
        )
    chunks = select_context_chunks(
        pregunta,
        internal_chunks,
        document_chunks,
        settings.MAX_CONTEXT_CHUNKS,
    )

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
        diagnostico = RagResponseDiagnostics(
            origen="deepseek",
            proveedor="DeepSeek",
            modelo=settings.DEEPSEEK_MODEL,
            fragmentos_documentales=len(document_chunks),
            fragmentos_internos=len(internal_chunks),
        )
    else:
        respuesta, fuentes, tokens_usados, sin_contexto = no_context_payload(pregunta)
        diagnostico = RagResponseDiagnostics(
            origen="local",
            proveedor="Motor local Enci",
            fragmentos_documentales=0,
            fragmentos_internos=0,
        )

    conversation_title = None
    if not payload.conversacion_id:
        try:
            conversation_title = await generate_conversation_title(pregunta)
        except (HTTPException, ValueError, KeyError, TypeError):
            conversation_title = normalize_conversation_title("", pregunta)

    conversation_id = await run_in_threadpool(
        save_conversation_turn,
        db,
        user,
        pregunta,
        respuesta,
        fuentes,
        tokens_usados,
        sin_contexto,
        diagnostico.model_dump(),
        payload.conversacion_id,
        conversation_title,
    )

    return RagChatResponse(
        respuesta=respuesta,
        fuentes=[RagSource(**source) for source in fuentes],
        conversacion_id=conversation_id,
        tokens_usados=tokens_usados,
        timestamp=datetime.now(timezone.utc),
        # TEMPORAL: retirar diagnostico y su indicador visual antes de la entrega final.
        diagnostico=diagnostico,
        titulo_conversacion=conversation_title,
    )


@router.get("/conversations", response_model=list[RagConversationResponse])
async def get_rag_conversations(
    limit: int = Query(default=50, ge=1, le=100),
    user: dict = Depends(require_role("vendedor")),
):
    """Lista conversaciones RAG segun alcance de rol."""

    db = get_db()
    conversations = await run_in_threadpool(list_conversations, db, user, limit)
    conversations_without_title = []
    for conversation in conversations:
        if conversation.get("titulo"):
            continue
        first_question = next(
            (
                message.get("texto", "")
                for message in conversation.get("mensajes", [])
                if message.get("tipo") == "pregunta" and message.get("texto")
            ),
            "",
        )
        if first_question:
            conversations_without_title.append((conversation, first_question))

    if conversations_without_title:
        try:
            generated_titles = await generate_conversation_titles(
                [question for _conversation, question in conversations_without_title]
            )
            for (conversation, _question), title in zip(
                conversations_without_title,
                generated_titles,
                strict=True,
            ):
                await run_in_threadpool(
                    db.collection("chatConversaciones").document(conversation["id"]).update,
                    {"titulo": title},
                )
                conversation["titulo"] = title
        except (HTTPException, ValueError, KeyError, TypeError):
            pass

    return conversations


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
