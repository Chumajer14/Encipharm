import { useMemo, useRef, useState } from "react";

import Icon from "../components/Icon";
import { sendRagMessage } from "../services/api";

const MAX_QUESTION_LENGTH = 1000;
const FIELD_SUGGESTIONS = [
  "Resume mis oportunidades activas.",
  "Que clientes requieren seguimiento comercial?",
  "Que informacion interna existe sobre bioseguridad?",
  "Como debo explicar el pipeline a un supervisor?",
];

function formatTime(value) {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function ChatBubble({ message }) {
  const isQuestion = message.type === "question";
  const hasSources = Array.isArray(message.sources) && message.sources.length > 0;

  return (
    <article className={`mobile-rag-bubble ${isQuestion ? "question" : "answer"}`}>
      <header>
        <span>{isQuestion ? "Consulta" : hasSources ? "Respuesta" : "Sin contexto"}</span>
        <time>{formatTime(message.timestamp)}</time>
      </header>
      <p>{message.text}</p>
      {hasSources && (
        <details className="mobile-rag-sources">
          <summary>Fuentes ({message.sources.length})</summary>
          <ul>
            {message.sources.map((source, index) => (
              <li key={`${source.documento || "fuente"}-${index}`}>
                <strong>{source.documento || "Documento interno"}</strong>
                {source.pagina ? <span> Pagina {source.pagina}</span> : null}
                {source.fragmento ? <small>{source.fragmento}</small> : null}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

function IARag({ token }) {
  const inputRef = useRef(null);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const remaining = MAX_QUESTION_LENGTH - question.length;

  const canSubmit = useMemo(
    () => question.trim().length > 0 && question.length <= MAX_QUESTION_LENGTH && !isLoading,
    [isLoading, question],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    const pregunta = question.trim();
    setQuestion("");
    setError("");
    setIsLoading(true);
    setMessages((current) => [
      ...current,
      { type: "question", text: pregunta, timestamp: new Date() },
    ]);

    try {
      const response = await sendRagMessage(token, {
        pregunta,
        conversacion_id: conversationId,
      });

      setConversationId(response.conversacion_id || conversationId);
      setMessages((current) => [
        ...current,
        {
          type: "answer",
          text: response.respuesta,
          sources: response.fuentes || [],
          timestamp: response.timestamp ? new Date(response.timestamp) : new Date(),
        },
      ]);
    } catch (chatError) {
      setError(chatError.message || "No se pudo consultar el asistente.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSuggestion(suggestion) {
    setQuestion(suggestion);
    inputRef.current?.focus();
  }

  function resetConversation() {
    setConversationId(null);
    setError("");
    setMessages([]);
    setQuestion("");
  }

  return (
    <main className="app-shell mobile-rag-shell">
      <header className="page-title compact-title mobile-rag-header">
        <div>
          <span className="eyebrow">Asistente Encipharm</span>
          <h1>IA RAG</h1>
          <p>Consulta informacion interna, CRM y documentos de apoyo desde terreno.</p>
        </div>
        <button className="icon-btn" onClick={resetConversation} type="button" aria-label="Nueva conversacion">
          <Icon name="sync" size={18} />
        </button>
      </header>

      <section className="mobile-rag-card" aria-live="polite">
        {messages.length === 0 ? (
          <div className="mobile-rag-empty">
            <div className="mobile-rag-mark">
              <Icon name="spark" size={26} />
            </div>
            <h2>Pregunta libre</h2>
            <p>El asistente buscara contexto corporativo, comercial y documental para responder.</p>
            <div className="mobile-rag-suggestions">
              {FIELD_SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} onClick={() => handleSuggestion(suggestion)} type="button">
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mobile-rag-thread">
            {messages.map((message, index) => (
              <ChatBubble key={`${message.type}-${message.timestamp.getTime()}-${index}`} message={message} />
            ))}
          </div>
        )}

        {isLoading && (
          <div className="mobile-rag-loading">
            <span />
            Procesando consulta...
          </div>
        )}
      </section>

      {error && <p className="form-error mobile-rag-error">{error}</p>}

      <form className="mobile-rag-composer" onSubmit={handleSubmit}>
        <label htmlFor="mobile-rag-question">Pregunta</label>
        <textarea
          id="mobile-rag-question"
          maxLength={MAX_QUESTION_LENGTH}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Escribe una consulta sobre clientes, oportunidades, documentos o procesos..."
          ref={inputRef}
          rows={3}
          value={question}
        />
        <div className="mobile-rag-actions">
          <span className={remaining < 100 ? "limit-warning" : ""}>
            {question.length}/{MAX_QUESTION_LENGTH}
          </span>
          <button className="primary-btn" disabled={!canSubmit} type="submit">
            <Icon name="arrow" size={17} />
            Enviar
          </button>
        </div>
      </form>
    </main>
  );
}

export default IARag;
