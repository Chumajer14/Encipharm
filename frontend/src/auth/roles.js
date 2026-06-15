export const ROLE_LABELS = Object.freeze({
  sin_acceso: "sin acceso",
  admin: "administrador",
  supervisor: "supervisor",
  vendedor: "vendedor",
});

const ROLE_RANKS = Object.freeze({
  sin_acceso: 0,
  vendedor: 1,
  supervisor: 2,
  admin: 3,
});

/**
 * Retorna true cuando el rol del backend puede acceder a una ruta protegida.
 * La jerarquia replica el contrato FastAPI de require_role.
 */
export function hasMinimumRole(userRole, minimumRole = "vendedor") {
  const userRank = ROLE_RANKS[userRole] ?? 0;
  const requiredRank = ROLE_RANKS[minimumRole] ?? Number.POSITIVE_INFINITY;

  return userRank >= requiredRank;
}

/**
 * Identifica roles que pueden consumir metricas agregadas de supervisor.
 */
export function isSupervisorRole(userRole) {
  return hasMinimumRole(userRole, "supervisor");
}

export function getRoleLabel(userRole) {
  return ROLE_LABELS[userRole] || "sin rol valido";
}
