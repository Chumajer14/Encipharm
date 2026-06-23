import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Icon from "../components/Icon";
import { getRagConversations, sendRagMessage } from "../services/api";

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
  const origin = message.diagnostic?.origen || "other";
  const originLabel = {
    deepseek: "Respuesta generada por DeepSeek",
    local: "Respuesta generada por el motor local de Enci",
    other: "Respuesta generada por otro origen",
  }[origin] || "Respuesta generada por otro origen";
  const [visibleText, setVisibleText] = useState(message.animate ? "" : message.text);
  const [isTyping, setIsTyping] = useState(Boolean(message.animate));

  useEffect(() => {
    if (!message.animate) return undefined;
    let characterIndex = 0;
    const intervalId = window.setInterval(() => {
      characterIndex += 1;
      setVisibleText(message.text.slice(0, characterIndex));
      if (characterIndex >= message.text.length) {
        window.clearInterval(intervalId);
        setIsTyping(false);
      }
    }, 10);
    return () => window.clearInterval(intervalId);
  }, [message.animate, message.text]);

  return (
    <article className={`mobile-rag-bubble ${isQuestion ? "question" : "answer"}`}>
      <header>
        <span>{isQuestion ? "Consulta" : "Respuesta"}</span>
        <div className="mobile-rag-timing">
          {!isQuestion && (
            <i
              aria-label={originLabel}
              className={`mobile-rag-origin ${origin}`}
              role="img"
              title={`${originLabel} · Corpus: ${message.diagnostic?.fragmentos_documentales || 0} · Datos internos: ${message.diagnostic?.fragmentos_internos || 0} · Tokens: ${message.tokensUsed || 0}`}
            />
          )}
          <time>{formatTime(message.timestamp)}</time>
        </div>
      </header>
      <p>{visibleText}{isTyping && <span aria-hidden="true" className="mobile-rag-cursor">|</span>}</p>
      {hasSources && !isTyping && (
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

function getConversationTitle(conversation) {
  if (conversation.titulo) return conversation.titulo;
  const firstQuestion = conversation.mensajes?.find((message) => message.tipo === "pregunta")?.texto;
  return firstQuestion || "Conversacion anterior";
}

function EnciChat({ token }) {
  const inputRef = useRef(null);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [conversations, setConversations] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(Boolean(token));
  const remaining = MAX_QUESTION_LENGTH - question.length;

  const canSubmit = useMemo(
    () => question.trim().length > 0 && question.length <= MAX_QUESTION_LENGTH && !isLoading,
    [isLoading, question],
  );

  const refreshConversations = useCallback(async () => {
    if (!token) return;
    setHistoryLoading(true);
    setHistoryError("");
    try {
      setConversations(await getRagConversations(token));
    } catch (loadError) {
      setHistoryError(loadError.message || "No se pudo cargar el historial.");
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    getRagConversations(token)
      .then((savedConversations) => {
        if (active) setConversations(savedConversations);
      })
      .catch((loadError) => {
        if (active) setHistoryError(loadError.message || "No se pudo cargar el historial.");
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

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
          diagnostic: response.diagnostico,
          tokensUsed: response.tokens_usados,
          animate: true,
          timestamp: response.timestamp ? new Date(response.timestamp) : new Date(),
        },
      ]);
      void refreshConversations();
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

  function openConversation(conversation) {
    setConversationId(conversation.id);
    setError("");
    setQuestion("");
    setMessages((conversation.mensajes || []).map((message, index) => ({
      type: message.tipo === "pregunta" ? "question" : "answer",
      text: message.texto,
      sources: message.fuentes || [],
      diagnostic: message.diagnostico,
      tokensUsed: message.tokens_usados,
      animate: false,
      timestamp: new Date(message.timestamp || conversation.updatedAt || Date.now()),
      historyKey: `${conversation.id}-${index}`,
    })));
  }

  function handleQuestionKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <main className="app-shell mobile-rag-shell">
      <header className="page-title compact-title mobile-rag-header">
        <div>
          <span className="eyebrow">Asistente comercial</span>
          <h1>Enci Chat</h1>
          <p>Consulta informacion interna, CRM y documentos de apoyo desde terreno.</p>
        </div>
        <button className="icon-btn" onClick={resetConversation} type="button" aria-label="Nueva conversacion">
          <Icon name="sync" size={18} />
        </button>
      </header>

      <section className="mobile-chat-history" aria-label="Mis conversaciones">
        <div className="mobile-chat-history-header">
          <div>
            <strong>Mis conversaciones</strong>
            <span>Historial privado de tu cuenta</span>
          </div>
          <button className="icon-btn" disabled={historyLoading} onClick={refreshConversations} type="button" aria-label="Actualizar conversaciones">
            <Icon name="sync" size={16} />
          </button>
        </div>
        {historyError && <p className="form-error">{historyError}</p>}
        <div className="mobile-chat-history-list">
          {conversations.map((conversation) => (
            <button
              className={conversation.id === conversationId ? "active" : ""}
              key={conversation.id}
              onClick={() => openConversation(conversation)}
              type="button"
            >
              <strong>{getConversationTitle(conversation)}</strong>
              <span>{conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleDateString("es-CL") : "Sin fecha"}</span>
            </button>
          ))}
          {!historyLoading && !conversations.length && <span className="mobile-chat-history-empty">Sin conversaciones guardadas.</span>}
          {historyLoading && <span className="mobile-chat-history-empty">Cargando...</span>}
        </div>
      </section>

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
              <ChatBubble key={message.historyKey || `${message.type}-${message.timestamp.getTime()}-${index}`} message={message} />
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
          onKeyDown={handleQuestionKeyDown}
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

export default EnciChat;
