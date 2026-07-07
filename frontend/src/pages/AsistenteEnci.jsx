import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import ChatMessage from "../components/rag/ChatMessage";
import ChatSuggestions from "../components/rag/ChatSuggestions";
import ConversationHistory from "../components/rag/ConversationHistory";
import UploadDocuments from "../components/rag/UploadDocuments";
import { getRagConversations, sendRagMessage } from "../services/api";

const MAX_QUESTION_LENGTH = 1000;

function AsistenteEnci() {
  const { backendUser, idToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversations, setConversations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(Boolean(idToken));
  const [historyError, setHistoryError] = useState("");
  const remaining = MAX_QUESTION_LENGTH - question.length;
  const isAdmin = backendUser?.rol === "admin";

  const canSubmit = useMemo(
    () => question.trim().length > 0 && question.length <= MAX_QUESTION_LENGTH && !loading,
    [loading, question],
  );

  const refreshConversations = useCallback(async () => {
    if (!idToken) return;
    setHistoryLoading(true);
    setHistoryError("");
    try {
      setConversations(await getRagConversations(idToken));
    } catch (loadError) {
      setHistoryError(loadError.message || "No se pudo cargar el historial.");
    } finally {
      setHistoryLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    if (!idToken) return undefined;
    let active = true;
    getRagConversations(idToken)
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
  }, [idToken]);

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
          diagnostico: response.diagnostico,
          tokensUsados: response.tokens_usados,
          animate: true,
          timestamp: new Date(response.timestamp),
        },
      ]);
      void refreshConversations();
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

  function openConversation(conversation) {
    setConversationId(conversation.id);
    setError("");
    setQuestion("");
    setMessages((conversation.mensajes || []).map((message, index) => ({
      tipo: message.tipo,
      texto: message.texto,
      fuentes: message.fuentes || [],
      diagnostico: message.diagnostico,
      tokensUsados: message.tokens_usados,
      timestamp: new Date(message.timestamp || conversation.updatedAt || Date.now()),
      historyKey: `${conversation.id}-${index}`,
      animate: false,
    })));
  }

  function handleQuestionKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <main className="page rag-page">
      <section className="rag-chat-panel">
        <div className="header-row rag-header">
          <div>
            <p className="eyebrow">Enci Chat</p>
            <h1>Consulta tecnica y comercial</h1>
          </div>
          <button className="btn-secondary compact" onClick={resetConversation} type="button">
            Nueva conversacion
          </button>
        </div>

        <div className="rag-chat-window" aria-live="polite">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.historyKey || `${message.tipo}-${message.timestamp.getTime()}-${index}`}
              message={message}
            />
          ))}
          {!messages.length && (
            <div className="rag-empty-state">
              <strong>Sin mensajes.</strong>
              <span>Realiza una consulta sobre productos, dosificacion, bioseguridad o documentos comerciales internos.</span>
              <ChatSuggestions disabled={loading} onSelect={setQuestion} />
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
              onKeyDown={handleQuestionKeyDown}
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

      <aside className="rag-sidebar">
        <ConversationHistory
          activeId={conversationId}
          conversations={conversations}
          error={historyError}
          loading={historyLoading}
          onOpen={openConversation}
          onRefresh={refreshConversations}
        />
        {isAdmin && <UploadDocuments token={idToken} />}
      </aside>
    </main>
  );
}

export default AsistenteEnci;
