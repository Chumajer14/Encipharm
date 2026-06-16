export function ensureMobileAccess(backendUser) {
  if (backendUser?.rol === "sin_acceso") {
    throw new Error("Tu cuenta no tiene un rol habilitado en la app movil.");
  }

  if (backendUser?.appMovil === false) {
    throw new Error("Tu cuenta no tiene acceso habilitado a la app movil.");
  }
}
