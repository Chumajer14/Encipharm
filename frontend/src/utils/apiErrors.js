export function getFriendlyApiError(error) {
  const message = error?.message || "";

  if (message.includes("Failed to fetch")) {
    return "No se pudo conectar con la API. Revisa que el backend este corriendo en el puerto configurado.";
  }

  if (message.includes("401") || message.toLowerCase().includes("token")) {
    return "Tu sesion expiro o el token no pudo validarse. Cierra sesion e ingresa nuevamente.";
  }

  if (message.includes("403") || message.toLowerCase().includes("permis")) {
    return "No tienes permisos para realizar esta accion.";
  }

  if (message.includes("422") || message.toLowerCase().includes("validation")) {
    return "Revisa los campos obligatorios y el formato del correo.";
  }

  if (message.includes("500")) {
    return "La API tuvo un problema al guardar. Intenta nuevamente o revisa el log del backend.";
  }

  return message || "No se pudo completar la solicitud.";
}
