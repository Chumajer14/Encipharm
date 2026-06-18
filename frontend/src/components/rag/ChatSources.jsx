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

export default ChatSources;
