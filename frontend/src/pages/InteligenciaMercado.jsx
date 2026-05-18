import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import { getClientes, getInteracciones, getOportunidades, getPropuestas } from "../services/api";
import { compactMoney, matchText } from "../utils/commercialAnalytics";

const SUGGESTIONS = [
  "Clientes con oportunidades en riesgo",
  "Propuestas rechazadas por monto",
  "Sectores con mayor pipeline",
  "Ultimas interacciones comerciales",
];

function InteligenciaMercado() {
  const { idToken } = useAuth();
  const [query, setQuery] = useState("");
  const [clientes, setClientes] = useState([]);
  const [interacciones, setInteracciones] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [propuestas, setPropuestas] = useState([]);

  useEffect(() => {
    async function loadData() {
      if (!idToken) return;
      const [clientsData, interactionsData, opportunitiesData, proposalsData] = await Promise.all([
        getClientes(idToken),
        getInteracciones(idToken),
        getOportunidades(idToken),
        getPropuestas(idToken),
      ]);
      setClientes(clientsData);
      setInteracciones(interactionsData);
      setOportunidades(opportunitiesData);
      setPropuestas(proposalsData);
    }

    loadData();
  }, [idToken]);

  const insights = useMemo(() => {
    const rejected = propuestas.filter((item) => item.estado === "rechazada");
    const risk = oportunidades.filter((item) => ["perdido", "negociacion"].includes(item.etapa));
    const sectorPipeline = clientes.map((cliente) => ({
      label: cliente.rubro || "Sin rubro",
      value: oportunidades
        .filter((item) => item.clienteId === cliente.id)
        .reduce((sum, item) => sum + Number(item.valorEstimado || 0), 0),
    })).filter((item) => item.value > 0);

    return [
      ...risk.map((item) => ({ type: "Riesgo", title: item.titulo, body: `${item.etapa} - ${compactMoney(item.valorEstimado)}` })),
      ...rejected.map((item) => ({ type: "Propuesta", title: item.titulo, body: `Rechazada - ${compactMoney(item.montoTotal)}` })),
      ...sectorPipeline.map((item) => ({ type: "Rubro", title: item.label, body: `Pipeline ${compactMoney(item.value)}` })),
      ...interacciones.slice(0, 10).map((item) => ({ type: "Actividad", title: item.tipo, body: item.resumen })),
    ].filter((item) => matchText(item, query, ["type", "title", "body"]));
  }, [clientes, interacciones, oportunidades, propuestas, query]);

  return (
    <main className="page inteligencia-content">
      <section className="chat-panel">
        <article className="card command-card">
          <div className="card-header"><div className="card-title"><span className="card-title-icon">AI</span>Asistente de Inteligencia</div><span className="chat-model-badge"><i />CRM real</span></div>
          <div className="chat-messages">
            <div className="chat-message ai">Consulta el CRM por clientes, oportunidades, propuestas o actividad comercial. Las respuestas se calculan con datos actuales de la BD.</div>
            {query && <div className="chat-message user">{query}</div>}
            {query && <div className="chat-message ai">{insights.length} resultados encontrados para la consulta.</div>}
          </div>
          <div className="chat-suggestions">
            {SUGGESTIONS.map((suggestion) => <button className="chat-suggestion" key={suggestion} onClick={() => setQuery(suggestion)} type="button">{suggestion}</button>)}
          </div>
          <div className="chat-input-wrap">
            <textarea className="chat-input" onChange={(event) => setQuery(event.target.value)} placeholder="Pregunta sobre mercado, clientes, propuestas o competencia..." value={query} />
          </div>
        </article>
      </section>

      <section className="news-panel">
        <article className="card command-card">
          <div className="card-header"><div className="card-title"><span className="card-title-icon">NW</span>Señales del CRM</div></div>
          <div className="news-feed">
            {insights.map((item, index) => (
              <article className="news-item" key={`${item.type}-${item.title}-${index}`}>
                <span>{item.type}</span>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          {insights.length === 0 && <section className="empty-state"><h2>Sin señales disponibles</h2><p>Registra oportunidades, propuestas o interacciones para alimentar esta vista.</p></section>}
        </article>
      </section>
    </main>
  );
}

export default InteligenciaMercado;
