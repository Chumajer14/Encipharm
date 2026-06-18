import { useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import { getRagDocuments, reindexRagDocuments, sendRagMessage, uploadRagDocument } from "../services/api";

const MAX_QUESTION_LENGTH = 1000;
const NO_CONTEXT_TEXT = "No encontre informacion suficiente en los documentos de Encipharm para responder esta pregunta.";

function ChatSources({ sources = [] }) {
  if (!sources.length) return null;

  return (
    <details className="rag-sources">
      <summary>Fuentes ({sources.length})</summary>
      <div className="rag-source-list">
        {sources.map((source, index) => (
          <article className="rag-source-item" key={`${source.documento}-${source.pagina}-${index}`}>
            <strong>{source.documento}</strong>
            <span>Pagina {source.pagina || "N/D"}</span>
            <p>{source.fragmento}</p>
          </article>
        ))}
      </div>
    </details>
  );
}

function ChatMessage({ message }) {
  const isQuestion = message.tipo === "pregunta";
  const isNoContext = !isQuestion && message.texto.startsWith(NO_CONTEXT_TEXT);

  return (
    <article className={`rag-message ${isQuestion ? "question" : "answer"} ${isNoContext ? "no-context" : ""}`}>
      <div className="rag-message-meta">
        <span>{isQuestion ? "Consulta" : isNoContext ? "Sin contexto" : "Respuesta"}</span>
        <time>{message.timestamp.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</time>
      </div>
      <p>{message.texto}</p>
      <ChatSources sources={message.fuentes} />
    </article>
  );
}

function UploadDocuments({ token }) {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refreshDocuments() {
    setLoading(true);
    setError("");
    try {
      const docs = await getRagDocuments(token);
      setDocuments(docs);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const result = await uploadRagDocument(token, file);
      setStatus(`${result.documento}: ${result.chunks_indexados} fragmentos indexados`);
      setFile(null);
      event.currentTarget.reset();
      await refreshDocuments();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReindex() {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      const result = await reindexRagDocuments(token);
      setStatus(`${result.chunks_indexados} fragmentos reindexados`);
      await refreshDocuments();
    } catch (reindexError) {
      setError(reindexError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="rag-admin-panel">
      <div className="rag-panel-header">
        <div>
          <h2>Corpus documental</h2>
          <p>Gestion de archivos internos disponibles para consulta.</p>
        </div>
        <div className="rag-admin-actions">
          <button className="btn-secondary compact" disabled={loading} onClick={refreshDocuments} type="button">
            Actualizar
          </button>
          <button className="btn-secondary compact" disabled={loading} onClick={handleReindex} type="button">
            Reindexar
          </button>
        </div>
      </div>

      <form className="rag-upload-form" onSubmit={handleUpload}>
        <input
          accept=".pdf,.docx,.txt"
          disabled={loading}
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          type="file"
        />
        <button className="btn-primary" disabled={!file || loading} type="submit">
          Subir documento
        </button>
      </form>

      {status && <p className="rag-status success">{status}</p>}
      {error && <p className="rag-status error">{error}</p>}

      <div className="rag-document-list">
        {documents.map((document) => (
          <article className="rag-document-item" key={document.id}>
            <strong>{document.nombre}</strong>
            <span>{document.chunks_count} fragmentos</span>
          </article>
        ))}
        {!documents.length && <p className="muted-text">Sin documentos indexados.</p>}
      </div>
    </aside>
  );
}

function AsistenteEncipharm() {
  const { backendUser, idToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const remaining = MAX_QUESTION_LENGTH - question.length;
  const isAdmin = backendUser?.rol === "admin";

  const canSubmit = useMemo(
    () => question.trim().length > 0 && question.length <= MAX_QUESTION_LENGTH && !loading,
    [loading, question],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    const pregunta = question.trim();
    setQuestion("");
    setError("");
    setLoading(true);
    setMessages((current) => [
      ...current,
      { tipo: "pregunta", texto: pregunta, timestamp: new Date() },
    ]);

    try {
      const response = await sendRagMessage(idToken, {
        pregunta,
        conversacion_id: conversationId,
      });
      setConversationId(response.conversacion_id);
      setMessages((current) => [
        ...current,
        {
          tipo: "respuesta",
          texto: response.respuesta,
          fuentes: response.fuentes,
          timestamp: new Date(response.timestamp),
        },
      ]);
    } catch (chatError) {
      setError(chatError.message || "No se pudo consultar el asistente.");
    } finally {
      setLoading(false);
    }
  }

  function resetConversation() {
    setMessages([]);
    setConversationId(null);
    setError("");
    setQuestion("");
  }

  return (
    <main className="page rag-page">
      <section className="rag-chat-panel">
        <div className="header-row rag-header">
          <div>
            <p className="eyebrow">Asistente Encipharm</p>
            <h1>Consulta tecnica y comercial</h1>
          </div>
          <button className="btn-secondary compact" onClick={resetConversation} type="button">
            Nueva conversacion
          </button>
        </div>

        <div className="rag-chat-window" aria-live="polite">
          {messages.map((message, index) => (
            <ChatMessage key={`${message.tipo}-${message.timestamp.getTime()}-${index}`} message={message} />
          ))}
          {!messages.length && (
            <div className="rag-empty-state">
              <strong>Sin mensajes.</strong>
              <span>Realiza una consulta sobre productos, dosificacion, bioseguridad o documentos comerciales internos.</span>
            </div>
          )}
          {loading && <div className="rag-loading">Procesando consulta...</div>}
        </div>

        {error && <p className="rag-status error">{error}</p>}

        <form className="rag-chat-input" onSubmit={handleSubmit}>
          <label htmlFor="rag-question">
            <span>Pregunta</span>
            <textarea
              id="rag-question"
              maxLength={MAX_QUESTION_LENGTH}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Escribe una consulta sobre documentos internos..."
              value={question}
            />
          </label>
          <div className="rag-input-footer">
            <span className={remaining < 100 ? "limit-warning" : ""}>{question.length}/{MAX_QUESTION_LENGTH}</span>
            <button className="btn-primary" disabled={!canSubmit} type="submit">
              Enviar
            </button>
          </div>
        </form>
      </section>

      {isAdmin && <UploadDocuments token={idToken} />}
    </main>
  );
}

export default AsistenteEncipharm;
