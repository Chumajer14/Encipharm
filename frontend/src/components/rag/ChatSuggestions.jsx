const SUGGESTIONS = [
  "Cual es la dosificacion recomendada para cerdos?",
  "Resume las precauciones de bioseguridad del producto.",
  "Que documentos respaldan esta recomendacion?",
];

function ChatSuggestions({ disabled = false, onSelect }) {
  return (
    <div className="rag-suggestions" aria-label="Consultas sugeridas">
      {SUGGESTIONS.map((suggestion) => (
        <button disabled={disabled} key={suggestion} onClick={() => onSelect(suggestion)} type="button">
          {suggestion}
        </button>
      ))}
    </div>
  );
}

export default ChatSuggestions;
