import ChatSources from "./ChatSources";

export const NO_CONTEXT_TEXT = "No encontre informacion suficiente en los documentos de Encipharm para responder esta pregunta.";

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

export default ChatMessage;
