import { useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import ChatMessage from "../components/rag/ChatMessage";
import ChatSuggestions from "../components/rag/ChatSuggestions";
import UploadDocuments from "../components/rag/UploadDocuments";
import { sendRagMessage } from "../services/api";

const MAX_QUESTION_LENGTH = 1000;

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
