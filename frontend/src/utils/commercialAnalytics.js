export const STAGE_LABELS = {
  nuevo: "Prospeccion",
  contactado: "Calificacion",
  cotizacion: "Propuesta",
  negociacion: "Negociacion",
  ganado: "Cierre",
  perdido: "Perdido",
};

export const STAGES = ["nuevo", "contactado", "cotizacion", "negociacion", "ganado"];

export function money(value) {
  return `$${Number(value || 0).toLocaleString("es-CL")}`;
}

export function compactMoney(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return money(amount);
}

export function initials(text = "") {
  return String(text || "EV")
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "EV";
}

export function weightedValue(item) {
  return Number(item?.valorEstimado || 0) * (Number(item?.probabilidad || 0) / 100);
}

export function buildSellerRows({ oportunidades = [], propuestas = [], users = [] }) {
  const usersById = new Map(users.map((user) => [user.uid, user]));
  const sellerIds = new Set([
    ...oportunidades.map((item) => item.vendedorUid).filter(Boolean),
    ...propuestas.map((item) => item.vendedorUid).filter(Boolean),
    ...users.map((user) => user.uid),
  ]);

  return [...sellerIds].map((uid) => {
    const user = usersById.get(uid);
    const sellerOpportunities = oportunidades.filter((item) => item.vendedorUid === uid);
    const sellerProposals = propuestas.filter((item) => item.vendedorUid === uid);
    const accepted = sellerProposals.filter((item) => item.estado === "aceptada");
    const projected = sellerOpportunities.reduce((sum, item) => sum + weightedValue(item), 0);
    const realized = accepted.reduce((sum, item) => sum + Number(item.montoTotal || 0), 0);
    const stageCounts = Object.fromEntries(
      STAGES.map((stage) => [stage, sellerOpportunities.filter((item) => item.etapa === stage).length]),
    );
    const winRate = sellerProposals.length
      ? Math.round((accepted.length / sellerProposals.length) * 100)
      : 0;

    return {
      uid,
      name: user?.nombre || user?.email || uid,
      email: user?.email || uid,
      active: user?.activo !== false,
      role: user?.rol || "vendedor",
      projected,
      realized,
      pipeline: sellerOpportunities.reduce((sum, item) => sum + Number(item.valorEstimado || 0), 0),
      stageCounts,
      total: sellerOpportunities.length,
      winRate,
      accepted,
      negotiating: sellerOpportunities.filter((item) => item.etapa === "negociacion"),
    };
  }).sort((a, b) => b.pipeline - a.pipeline);
}

export function matchText(item, query, fields) {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  return fields.some((field) => String(item[field] || "").toLowerCase().includes(term));
}
