import { useEffect, useState } from "react";
import ChatSources from "./ChatSources";

export const NO_CONTEXT_TEXT = "Este asistente esta enfocado en consultas tecnicas, comerciales, documentales y datos internos de Enci.";

const ORIGIN_LABELS = {
  deepseek: "Respuesta generada por DeepSeek",
  local: "Respuesta generada por el motor local de Enci",
  other: "Respuesta generada por otro origen",
};

function ChatMessage({ message }) {
  const isQuestion = message.tipo === "pregunta";
  const isNoContext = !isQuestion && message.texto.startsWith(NO_CONTEXT_TEXT);
  const origin = message.diagnostico?.origen || "other";
  const diagnosticLabel = ORIGIN_LABELS[origin] || ORIGIN_LABELS.other;
  const diagnosticDetails = [
    diagnosticLabel,
    message.diagnostico?.modelo && `Modelo: ${message.diagnostico.modelo}`,
    `Corpus: ${message.diagnostico?.fragmentos_documentales || 0}`,
    `Datos internos: ${message.diagnostico?.fragmentos_internos || 0}`,
    Number.isFinite(message.tokensUsados) && `Tokens: ${message.tokensUsados}`,
  ].filter(Boolean).join(" · ");
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
          {!isQuestion && (
            // TEMPORAL: retirar el indicador de origen antes de la entrega final.
            <i
              aria-label={diagnosticLabel}
              className={`rag-origin-dot ${origin}`}
              role="img"
              title={diagnosticDetails}
            />
          )}
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
