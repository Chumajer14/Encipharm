import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import LoadingState from "../components/LoadingState";
import useCachedQuery from "../hooks/useCachedQuery";
import { getClientes, getOportunidades, getPropuestas, getUsers } from "../services/api";
import { buildOpportunityCompetitionProfile, STAGE_LABELS, weightedValue } from "../utils/commercialAnalytics";

const FUNNEL_STAGES = ["nuevo", "contactado", "cotizacion", "negociacion", "ganado"];
const FILTER_STAGES = [...FUNNEL_STAGES, "perdido"];

function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`;
}

function buildFunnel(oportunidades) {
  const rows = FUNNEL_STAGES.map((etapa) => {
    const items = oportunidades.filter((item) => item.etapa === etapa);
    return {
      etapa,
      label: STAGE_LABELS[etapa],
      count: items.length,
      value: items.reduce((sum, item) => sum + Number(item.valorEstimado || 0), 0),
    };
  });
  const maxCount = Math.max(...rows.map((row) => row.count), 1);
  return rows.map((row) => ({
    ...row,
    percent: Math.round((row.count / maxCount) * 100),
  }));
}

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function buildClientSites(cliente, oportunidad) {
  const productionType = cliente?.rubro || oportunidad?.titulo || "Sin tipo";
  const region = cliente?.region || "Sin region";
  const baseAnimals = Math.max(0, Math.round(Number(oportunidad?.valorEstimado || 0) / 850));
  if (!cliente) return [];

  return [
    {
      id: `${cliente.id}-principal`,
      name: cliente.empresa || cliente.nombre || "Plantel principal",
      productionType,
      animals: baseAnimals,
      region,
    },
  ];
}

function OpportunityModal({ cliente, onClose, oportunidad, propuestas, sellerName }) {
  const profile = buildOpportunityCompetitionProfile({ cliente, oportunidad, propuestas });
  const sites = buildClientSites(cliente, oportunidad);
  const totalAnimals = sites.reduce((sum, site) => sum + site.animals, 0);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="opportunity-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="opportunity-modal" role="dialog" aria-modal="true" aria-labelledby="opportunity-modal-title">
        <button className="opportunity-modal-close" type="button" onClick={onClose}>×</button>
        <header className="opportunity-modal-header">
          <h2 id="opportunity-modal-title">{cliente?.empresa || cliente?.nombre || oportunidad.clienteId}</h2>
          <p>{oportunidad.titulo}</p>
          <div className="opportunity-modal-meta">
            <span>{sellerName}</span>
            <span>{STAGE_LABELS[oportunidad.etapa] || oportunidad.etapa}</span>
          </div>
        </header>

        <div className="opportunity-modal-body">
          <section className="opportunity-modal-section">
            <h3>Informacion de la oportunidad</h3>
            <div className="opportunity-info-grid">
              <div className="opportunity-info-card">
                <span>Valor propuesta</span>
                <strong>{money(oportunidad.valorEstimado)}</strong>
              </div>
              <div className="opportunity-info-card">
                <span>Probabilidad de cierre</span>
                <strong>{profile.probability}%</strong>
              </div>
              <div className="opportunity-info-card">
                <span>Valor ponderado</span>
                <strong>{money(profile.weighted)}</strong>
              </div>
              <div className="opportunity-info-card">
                <span>ID oportunidad</span>
                <strong>{oportunidad.id}</strong>
              </div>
            </div>
          </section>

          <section className="opportunity-modal-section">
            <h3>Competidores identificados</h3>
            <div className="competitor-chip-row">
              {profile.competitors.map((competitor) => (
                <span className={`competitor-chip ${competitor.tone}`} key={competitor.id}>
                  <i>{competitor.name.slice(0, 1)}</i>{competitor.name}
                </span>
              ))}
              {profile.competitors.length === 0 && <span className="competitor-empty">Sin señales competitivas registradas</span>}
            </div>
          </section>

          <section className="opportunity-modal-section">
            <h3>Metricas competitivas</h3>
            <div className="competitive-metrics-grid">
              <div>
                <span>Presion competitiva</span>
                <strong className={profile.pressurePct >= 60 ? "danger" : "warning"}>{profile.pressurePct}%</strong>
              </div>
              <div>
                <span>Defensa comercial</span>
                <strong className={profile.defensePct >= 60 ? "success" : "warning"}>{profile.defensePct}%</strong>
              </div>
              <div>
                <span>Valor en riesgo</span>
                <strong className="danger">{money(profile.valueAtRisk)}</strong>
              </div>
              <div>
                <span>Propuestas rechazadas</span>
                <strong>{profile.rejected}/{profile.proposalCount}</strong>
              </div>
            </div>
          </section>

          <section className="opportunity-modal-section">
            <h3>Planteles del cliente</h3>
            <div className="client-sites-table">
              <div className="client-sites-head">
                <span>Plantel</span>
                <span>Tipo produccion</span>
                <span>N° animales</span>
              </div>
              {sites.map((site) => (
                <div className="client-sites-row" key={site.id}>
                  <strong>{site.name}</strong>
                  <span><i>{site.productionType}</i></span>
                  <b>{site.animals.toLocaleString("es-CL")}</b>
                </div>
              ))}
            </div>
            <div className="client-sites-total">
              <span>Total animales</span>
              <strong>{totalAnimals.toLocaleString("es-CL")}</strong>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function Oportunidades() {
  const { idToken } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [propuestas, setPropuestas] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const pipelineQuery = useCachedQuery(
    "pipeline:dataset",
    async () => {
      const [clientesData, oportunidadesData, propuestasData, usersData] = await Promise.all([
        getClientes(idToken),
        getOportunidades(idToken),
        getPropuestas(idToken),
        getUsers(idToken).catch(() => []),
      ]);
      return { clientes: clientesData, oportunidades: oportunidadesData, propuestas: propuestasData, users: usersData };
    },
    { enabled: Boolean(idToken), initialData: null },
  );
  const loading = pipelineQuery.loading;
  const error = pipelineQuery.error;

  useEffect(() => {
    if (!pipelineQuery.data) return;
    queueMicrotask(() => {
      setClientes(pipelineQuery.data.clientes);
      setOportunidades(pipelineQuery.data.oportunidades);
      setPropuestas(pipelineQuery.data.propuestas);
      setUsers(pipelineQuery.data.users);
    });
  }, [pipelineQuery.data]);

  const clientesById = useMemo(() => new Map(clientes.map((cliente) => [cliente.id, cliente])), [clientes]);
  const usersById = useMemo(() => new Map(users.map((user) => [user.uid, user])), [users]);

  const sellerOptions = useMemo(() => {
    const sellerIds = new Set(oportunidades.map((item) => item.vendedorUid).filter(Boolean));
    return [...sellerIds].map((uid) => ({
      uid,
      label: usersById.get(uid)?.nombre || usersById.get(uid)?.email || uid,
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [oportunidades, usersById]);

  const filteredOportunidades = useMemo(() => {
    const term = normalize(search);
    return oportunidades.filter((item) => {
      const cliente = clientesById.get(item.clienteId);
      const matchesSearch = !term || [
        item.titulo,
        item.descripcion,
        cliente?.empresa,
        cliente?.nombre,
        cliente?.rubro,
      ].some((value) => normalize(value).includes(term));
      const matchesSeller = !sellerFilter || item.vendedorUid === sellerFilter;
      const matchesStage = !stageFilter || item.etapa === stageFilter;
      return matchesSearch && matchesSeller && matchesStage;
    });
  }, [clientesById, oportunidades, search, sellerFilter, stageFilter]);

  const funnel = buildFunnel(filteredOportunidades);
  const totalPipeline = filteredOportunidades.reduce((sum, item) => sum + Number(item.valorEstimado || 0), 0);
  const totalPonderado = filteredOportunidades.reduce((sum, item) => sum + weightedValue(item), 0);
  const selectedOpportunity = oportunidades.find((item) => item.id === selectedOpportunityId);

  const clearFilters = () => {
    setSearch("");
    setSellerFilter("");
    setStageFilter("");
  };

  const sellerName = (uid) => usersById.get(uid)?.nombre || usersById.get(uid)?.email || uid || "Sin vendedor";
  const clientName = (item) => clientesById.get(item.clienteId)?.empresa || clientesById.get(item.clienteId)?.nombre || item.clienteId;

  return (
    <main className="page pipeline-content">
      <section className="pipeline-header-bar">
        <div>
          <h2>Pipeline & Funnels</h2>
          <p className="sub">Gestion detallada de oportunidades y proyeccion ponderada</p>
        </div>
      </section>

      {error && <section className="notice notice-error"><strong>Error</strong><span>{error}</span></section>}

      <section className="filters-card pipeline-filter-bar">
        <label>Buscar cliente
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ej: Agricola del Sur..."
          />
        </label>
        <label>Vendedor
          <select value={sellerFilter} onChange={(event) => setSellerFilter(event.target.value)}>
            <option value="">Todos los vendedores</option>
            {sellerOptions.map((seller) => <option key={seller.uid} value={seller.uid}>{seller.label}</option>)}
          </select>
        </label>
        <label>Etapa
          <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
            <option value="">Todas las etapas</option>
            {FILTER_STAGES.map((stage) => <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>)}
          </select>
        </label>
        <button className="pipeline-clear-btn" type="button" onClick={clearFilters}>Limpiar</button>
      </section>

      {loading && <LoadingState />}

      {!loading && <section className="pipeline-grid">
        <aside className="funnel-summary-card">
          <h3>Resumen del Funnel</h3>
          <div className="funnel-summary-stages">
            {funnel.map((stage) => (
              <div className={`funnel-summary-stage ${stage.etapa}`} key={stage.etapa}>
                <div className="fs-bar" style={{ width: `${Math.max(stage.percent, stage.count ? 12 : 0)}%` }} />
                <span className="fs-label">{stage.label}</span>
                <span className="fs-count">{stage.count}</span>
              </div>
            ))}
          </div>
          <div className="funnel-summary-totals">
            <p className="tot-label">Total Pipeline (Bruto)</p>
            <strong className="tot-value">{money(totalPipeline)}</strong>
            <p className="tot-label">Proyeccion Ponderada</p>
            <strong className="tot-value green">{money(totalPonderado)}</strong>
            <p className="tot-note">* Ajustado por % de exito historico</p>
          </div>
        </aside>

        <section className="pipeline-table-wrap">
          <table className="pipeline-table">
            <thead>
              <tr>
                <th>Cliente / Proyecto</th>
                <th>Vendedor</th>
                <th>Etapa</th>
                <th className="text-right">Valor Propuesta</th>
                <th>Probabilidad</th>
                <th className="text-right">Valor Pond.</th>
              </tr>
            </thead>
            <tbody>
              {filteredOportunidades.map((item) => {
                const probability = Math.max(0, Math.min(Number(item.probabilidad || 0), 100));
                return (
                  <tr key={item.id}>
                    <td>
                      <button className="pipeline-link pipeline-row-button" type="button" onClick={() => setSelectedOpportunityId(item.id)}>{clientName(item)}</button>
                      <small>{item.titulo}</small>
                    </td>
                    <td>{sellerName(item.vendedorUid)}</td>
                    <td><span className={`stage-pill ${item.etapa}`}>{STAGE_LABELS[item.etapa] || item.etapa}</span></td>
                    <td className="td-right">{money(item.valorEstimado)}</td>
                    <td>
                      <div className="probability-cell">
                        <span className="probability-bar"><i style={{ width: `${probability}%` }} /></span>
                        <small>{probability}%</small>
                      </div>
                    </td>
                    <td className="td-right">{money(weightedValue(item))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && filteredOportunidades.length === 0 && (
            <section className="empty-state pipeline-empty-state">
              <h2>Sin oportunidades para mostrar</h2>
              <p>Cambia los filtros para revisar el pipeline disponible.</p>
            </section>
          )}
        </section>
      </section>}

      {selectedOpportunity && (
        <OpportunityModal
          cliente={clientesById.get(selectedOpportunity.clienteId)}
          onClose={() => setSelectedOpportunityId("")}
          oportunidad={selectedOpportunity}
          propuestas={propuestas}
          sellerName={sellerName(selectedOpportunity.vendedorUid)}
        />
      )}
    </main>
  );
}

export default Oportunidades;
