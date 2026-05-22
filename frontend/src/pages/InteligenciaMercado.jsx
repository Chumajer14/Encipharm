const NEWS = [
  {
    source: "Agro Chile",
    date: "28 Ene 2025",
    icon: "🌾",
    tone: "red",
    title: "VetPharma lanza linea premium de nutricion avicola",
    body: "La empresa anuncio el lanzamiento de su nueva linea NutriPro Avicola, posicionada como alternativa de alto valor para productores intensivos.",
    tags: ["VetPharma", "nutricion", "avicola", "lanzamiento"],
  },
  {
    source: "Business Chile",
    date: "27 Ene 2025",
    icon: "🏭",
    tone: "green",
    title: "AgriSur expande operaciones hacia zona norte",
    body: "El centro en Antofagasta permitira reducir tiempos de entrega en un 40% para la zona minera y productores del norte.",
    tags: ["AgriSur", "logistica", "expansion", "zona norte"],
  },
  {
    source: "Diario Oficial",
    date: "26 Ene 2025",
    icon: "📜",
    tone: "yellow",
    title: "SAG publica nuevas normativas para sanitizacion animal",
    body: "Las nuevas regulaciones exigen registro individual de cada SKU y certificacion de origen para productos importados.",
    tags: ["Regulacion", "SAG", "certificacion"],
  },
  {
    source: "La Tercera",
    date: "25 Ene 2025",
    icon: "🧬",
    tone: "violet",
    title: "BioVet firma alianza con Universidad de Chile",
    body: "El acuerdo de 3 anos busca desarrollar suplementos geneticamente optimizados para planteles de alta productividad.",
    tags: ["BioVet", "investigacion", "genetica", "alianza"],
  },
  {
    source: "Diario Financiero",
    date: "24 Ene 2025",
    icon: "📈",
    tone: "red",
    title: "VetPharma reporta crecimiento del 23% en zona sur",
    body: "Resultados impulsados por la fuerte demanda en zona sur y la incorporacion de nuevos clientes ganaderos.",
    tags: ["VetPharma", "crecimiento", "zona sur"],
  },
];

function InteligenciaMercado() {
  return (
    <main className="page inteligencia-content static-market-intelligence">
      <div className="static-disabled-overlay" aria-hidden="true">
        <div className="not-operational-mark">X</div>
        <h2>No operativo.</h2>
      </div>

      <section className="chat-panel">
        <article className="card command-card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">IA</span>Asistente de Inteligencia</div>
            <span className="chat-model-badge"><i />RAG - Competencia</span>
          </div>

          <div className="static-chat-body">
            <div className="static-ai-row">
              <span className="static-ai-avatar">IA</span>
              <div className="static-ai-message">
                <p>
                  Hola. Soy el <strong>Asistente de Inteligencia de Mercado</strong> de Enci. Tengo acceso a noticias recientes y documentos sobre la competencia en el sector de salud animal.
                </p>
                <p>
                  Puedes preguntarme sobre estrategias de precios, lanzamientos de productos, movimientos de competidores, regulaciones o cualquier tema relacionado con el mercado.
                </p>
                <div className="static-source-pill">Fuente: Base de noticias actualizada</div>
              </div>
            </div>
          </div>

          <div className="static-suggestions">
            <span>¿Cual es la estrategia de precios actual de VetPharma?</span>
            <span>Compara los productos de nutricion avicola del mercado</span>
            <span>Noticias recientes sobre regulaciones sanitarias</span>
            <span>¿Quien son los principales competidores en zona sur?</span>
          </div>

          <div className="static-chat-input">
            <span>Pregunta sobre la competencia, mercado o documentos...</span>
            <button type="button" aria-label="Enviar" disabled>→</button>
          </div>
        </article>
      </section>

      <section className="news-panel">
        <article className="card command-card">
          <div className="card-header">
            <div className="card-title"><span className="card-title-icon">▣</span>Noticias de la Competencia</div>
          </div>
          <div className="static-news-filters">
            {["Todas", "VetPharma", "AgriSur", "BioVet", "Regulacion"].map((filter, index) => (
              <span className={index === 0 ? "active" : ""} key={filter}>{filter}</span>
            ))}
          </div>
          <div className="static-news-feed">
            {NEWS.map((item) => (
              <article className={`static-news-item ${item.tone}`} key={item.title}>
                <div className="static-news-thumb">{item.icon}</div>
                <div className="static-news-content">
                  <div className="static-news-meta"><span>{item.source}</span><small>{item.date}</small></div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  <div className="static-news-tags">
                    {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

export default InteligenciaMercado;
