from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


NO_CONTEXT_RESPONSE = (
    "Este asistente esta enfocado en consultas tecnicas, comerciales, documentales y datos internos de Enci. "
    "Puedes preguntarme sobre productos, sanidad animal, clientes, oportunidades, propuestas o interacciones."
)


class RagChatRequest(BaseModel):
    """Payload aceptado por el endpoint de chat RAG."""

    pregunta: str = Field(min_length=1, max_length=1000)
    conversacion_id: str | None = Field(default=None, max_length=128)

    @field_validator("pregunta")
    @classmethod
    def validate_question(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("La pregunta no puede estar vacia")
        return cleaned


class RagSource(BaseModel):
    """Fuente documental usada para construir una respuesta."""

    documento: str
    pagina: int | str | None = None
    fragmento: str


class RagResponseDiagnostics(BaseModel):
    """Metadatos de trazabilidad para validar el origen de respuestas durante UAT."""

    origen: Literal["deepseek", "local", "other"]
    proveedor: str
    modelo: str | None = None
    fragmentos_documentales: int = 0
    fragmentos_internos: int = 0


class RagChatResponse(BaseModel):
    """Respuesta del asistente RAG con trazabilidad documental."""

    respuesta: str
    fuentes: list[RagSource]
    conversacion_id: str
    tokens_usados: int
    timestamp: datetime
    diagnostico: RagResponseDiagnostics
    titulo_conversacion: str | None = None


class RagDocumentResponse(BaseModel):
    """Metadatos publicos de documentos indexados."""

    id: str
    nombre: str
    nombreOriginal: str | None = None
    descripcion: str | None = None
    gcsPath: str | None = None
    chunks_count: int = 0
    subidoPor: str | None = None
    subidoPorEmail: str | None = None
    tamano_bytes: int = 0
    activo: bool = True


class RagUploadResponse(BaseModel):
    """Resultado de carga e indexacion de documento."""

    mensaje: str
    documento: str
    chunks_indexados: int
    disponible_en: Literal["inmediato"] = "inmediato"


class RagConversationMessage(BaseModel):
    """Mensaje persistido en una conversacion RAG."""

    tipo: Literal["pregunta", "respuesta"]
    texto: str
    timestamp: datetime | None = None
    fuentes: list[RagSource] = []
    tokens_usados: int | None = None
    sin_contexto: bool | None = None
    diagnostico: RagResponseDiagnostics | None = None


class RagConversationResponse(BaseModel):
    """Conversacion RAG recuperada desde Firestore."""

    id: str
    usuarioId: str
    usuarioEmail: str | None = None
    rol: str
    titulo: str | None = None
    mensajes: list[RagConversationMessage] = []
    createdAt: datetime | None = None
    updatedAt: datetime | None = None
