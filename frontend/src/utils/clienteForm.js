export const CLIENTE_ESTADOS = ["En proceso", "Completado", "Inactivo"];

export const clienteInitialForm = {
  nombre: "",
  empresa: "",
  email: "",
  telefono: "",
  rubro: "",
  region: "",
  estado: "En proceso",
};

const textPattern = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ .,&'-]+$/;
const phonePattern = /^(\+?56)?9?\d{8}$/;

function normalizeText(value) {
  return String(value || "").trim();
}

export function buildClientePayload(form) {
  return {
    nombre: normalizeText(form.nombre),
    empresa: normalizeText(form.empresa),
    email: normalizeText(form.email).toLowerCase(),
    telefono: normalizeText(form.telefono) || null,
    rubro: normalizeText(form.rubro),
    region: normalizeText(form.region),
    estado: form.estado || "En proceso",
  };
}

export function validateClienteForm(form) {
  const payload = buildClientePayload(form);
  const errors = {};

  for (const field of ["nombre", "empresa", "rubro", "region"]) {
    if (!payload[field]) {
      errors[field] = "Campo obligatorio.";
    } else if (!textPattern.test(payload[field])) {
      errors[field] = "Usa solo letras, numeros y signos comerciales basicos.";
    }
  }

  if (!payload.email) {
    errors.email = "Campo obligatorio.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = "Ingresa un correo valido.";
  }

  const normalizedPhone = payload.telefono?.replace(/\s+/g, "");
  if (normalizedPhone && !phonePattern.test(normalizedPhone)) {
    errors.telefono = "Usa formato chileno, por ejemplo +56912345678.";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    payload: {
      ...payload,
      telefono: normalizedPhone || null,
    },
  };
}
