import { useEffect, useState } from "react";
import ChatSources from "./ChatSources";

export const NO_CONTEXT_TEXT = "Este asistente esta enfocado en consultas tecnicas, comerciales, documentales y datos internos de Enci.";

function ChatMessage({ message }) {
  const isQuestion = message.tipo === "pregunta";
  const isNoContext = !isQuestion && message.texto.startsWith(NO_CONTEXT_TEXT);
  const [visibleText, setVisibleText] = useState(message.animate ? "" : message.texto);
  const [isTyping, setIsTyping] = useState(Boolean(message.animate));

  useEffect(() => {
    if (!message.animate) {
      return undefined;
    }

    let characterIndex = 0;
    const intervalId = window.setInterval(() => {
      characterIndex += 1;
      setVisibleText(message.texto.slice(0, characterIndex));
      if (characterIndex >= message.texto.length) {
        window.clearInterval(intervalId);
        setIsTyping(false);
      }
    }, 10);

    return () => window.clearInterval(intervalId);
  }, [message.animate, message.texto]);

  return (
    <article className={`rag-message ${isQuestion ? "question" : "answer"} ${isNoContext ? "no-context" : ""}`}>
      <div className="rag-message-meta">
        <span>{isQuestion ? "Consulta" : isNoContext ? "Sin contexto" : "Respuesta"}</span>
        <div className="rag-message-timing">
          <time>{message.timestamp.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</time>
        </div>
      </div>
      <p>
        {visibleText}
        {isTyping && <span aria-hidden="true" className="rag-typing-cursor">|</span>}
      </p>
      {!isTyping && <ChatSources sources={message.fuentes} />}
    </article>
  );
}

export default ChatMessage;
