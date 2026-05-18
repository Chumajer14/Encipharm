import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import { getClientes, getOportunidades, getPropuestas } from "../services/api";
import { compactMoney } from "../utils/commercialAnalytics";

function AnalisisCompetencia() {
  const { idToken } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [propuestas, setPropuestas] = useState([]);

  useEffect(() => {
    async function loadData() {
      if (!idToken) return;
      const [clientsData, opportunitiesData, proposalsData] = await Promise.all([
        getClientes(idToken),
        getOportunidades(idToken),
        getPropuestas(idToken),
      ]);
      setClientes(clientsData);
      setOportunidades(opportunitiesData);
      setPropuestas(proposalsData);
    }

    loadData();
  }, [idToken]);

  const rows = useMemo(() => {
    const rejected = propuestas.filter((item) => item.estado === "rechazada");
    const lost = oportunidades.filter((item) => item.etapa === "perdido");
    return [
      ...rejected.map((item) => ({ source: "Propuesta rechazada", clienteId: item.clienteId, title: item.titulo, value: item.montoTotal })),
      ...lost.map((item) => ({ source: "Oportunidad perdida", clienteId: item.clienteId, title: item.titulo, value: item.valorEstimado })),
    ];
  }, [oportunidades, propuestas]);

  const clientesById = new Map(clientes.map((cliente) => [cliente.id, cliente]));

  return (
    <main className="page competencia-content">
      <section className="pipeline-header-bar">
        <div>
          <h2>Analisis de Competencia</h2>
          <p className="sub">Vista funcional basada en oportunidades perdidas y propuestas rechazadas registradas en BD</p>
        </div>
      </section>

      <section className="card command-card">
        <div className="card-header"><div className="card-title"><span className="card-title-icon">CP</span>Riesgos competitivos registrados</div></div>
        <table className="pipeline-table">
          <thead><tr><th>Origen</th><th>Cliente</th><th>Detalle</th><th className="text-right">Valor</th></tr></thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.source}-${row.title}-${index}`}>
                <td>{row.source}</td>
                <td>{clientesById.get(row.clienteId)?.empresa || row.clienteId}</td>
                <td>{row.title}</td>
                <td className="td-right">{compactMoney(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <section className="empty-state"><h2>Sin datos competitivos registrados</h2><p>Cuando existan propuestas rechazadas u oportunidades perdidas, se mostraran aqui.</p></section>}
      </section>
    </main>
  );
}

export default AnalisisCompetencia;
