export function getFriendlyApiError(error) {
  const message = error?.message || "";

  if (message.includes("Failed to fetch")) {
    return "No se pudo conectar con la API. Si estas en Vercel, el backend gratuito puede estar encendiendo; espera cerca de 40 segundos y actualiza la pagina.";
  }

  if (message.includes("401") || message.toLowerCase().includes("token")) {
    return "Tu sesion expiro o el token no pudo validarse. Cierra sesion e ingresa nuevamente.";
  }

  if (message.includes("403") || message.toLowerCase().includes("permis")) {
    return "No tienes permisos para realizar esta accion.";
  }

  if (message.includes("429") || message.toLowerCase().includes("cuota") || message.toLowerCase().includes("quota")) {
    return "La cuota de Firestore se alcanzo temporalmente. Espera un momento e intenta nuevamente.";
  }

  if (message.includes("503") || message.toLowerCase().includes("temporalmente no disponible")) {
    return "El servicio de datos esta temporalmente no disponible. Intenta nuevamente en unos minutos.";
  }

  if (message.includes("422") || message.toLowerCase().includes("validation")) {
    return "Revisa los campos obligatorios y el formato del correo.";
  }

  if (message.includes("500")) {
    return "La API tuvo un problema al guardar. Intenta nuevamente o revisa el log del backend.";
  }

  return message || "No se pudo completar la solicitud.";
}
