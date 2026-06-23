function getConversationTitle(conversation) {
  if (conversation.titulo) return conversation.titulo;
  const firstQuestion = conversation.mensajes?.find((message) => message.tipo === "pregunta")?.texto;
  if (!firstQuestion) return "Conversacion sin titulo";
  return firstQuestion.length > 54 ? `${firstQuestion.slice(0, 54)}...` : firstQuestion;
}

function formatConversationDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

function ConversationHistory({ activeId, conversations, error, loading, onOpen, onRefresh }) {
  return (
    <section className="rag-history-panel">
      <div className="rag-panel-header">
        <div>
          <h2>Mis conversaciones</h2>
          <p>Historial privado de la cuenta actual.</p>
        </div>
        <button className="btn-secondary compact" disabled={loading} onClick={onRefresh} type="button">
          Actualizar
        </button>
      </div>

      {error && <p className="rag-status error">{error}</p>}
      <div className="rag-conversation-list">
        {conversations.map((conversation) => (
          <button
            className={`rag-conversation-item ${activeId === conversation.id ? "active" : ""}`}
            key={conversation.id}
            onClick={() => onOpen(conversation)}
            type="button"
          >
            <strong>{getConversationTitle(conversation)}</strong>
            <span>{formatConversationDate(conversation.updatedAt)}</span>
          </button>
        ))}
        {!loading && !conversations.length && <p className="muted-text">Aun no hay conversaciones guardadas.</p>}
        {loading && <p className="muted-text">Cargando historial...</p>}
      </div>
    </section>
  );
}

export default ConversationHistory;
