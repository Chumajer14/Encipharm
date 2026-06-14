export const ETAPAS = [
  "Prospeccion",
  "Calificacion",
  "Propuesta",
  "Negociacion",
  "Cierre",
  "Perdido",
];

export const etapasColor = {
  Prospeccion: "#3B82F6",
  Calificacion: "#8B5CF6",
  Propuesta: "#F59E0B",
  Negociacion: "#F97316",
  Cierre: "#10B981",
  Perdido: "#EF4444",
};

export const etapaBackend = {
  Prospeccion: "nuevo",
  Calificacion: "contactado",
  Propuesta: "cotizacion",
  Negociacion: "negociacion",
  Cierre: "ganado",
  Perdido: "perdido",
};

export const etapaApp = {
  nuevo: "Prospeccion",
  contactado: "Calificacion",
  cotizacion: "Propuesta",
  negociacion: "Negociacion",
  ganado: "Cierre",
  perdido: "Perdido",
};

export function toBackendStage(etapa) {
  return etapaBackend[etapa] || "nuevo";
}

export function fromBackendStage(etapa) {
  return etapaApp[etapa] || "Prospeccion";
}
