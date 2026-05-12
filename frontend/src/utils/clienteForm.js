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
const formulaPrefixes = ["=", "+", "-", "@"];
const fieldLimits = {
  nombre: 120,
  empresa: 160,
  telefono: 8,
  rubro: 120,
  region: 80,
};

function normalizeText(value) {
  return String(value || "").trim();
}

export function normalizeTelefono(value) {
  const digits = normalizeText(value).replace(/\D/g, "");
  if (digits.startsWith("569") && digits.length >= 11) {
    return digits.slice(3, 11);
  }
  if (digits.startsWith("9") && digits.length >= 9) {
    return digits.slice(1, 9);
  }
  return digits;
}

export function buildClientePayload(form) {
  return {
    nombre: normalizeText(form.nombre),
    empresa: normalizeText(form.empresa),
    email: normalizeText(form.email).toLowerCase(),
    telefono: normalizeTelefono(form.telefono).slice(0, 8) || null,
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
    } else if (payload[field].length > fieldLimits[field]) {
      errors[field] = `Maximo ${fieldLimits[field]} caracteres.`;
    } else if (formulaPrefixes.some((prefix) => payload[field].startsWith(prefix))) {
      errors[field] = "No puede iniciar con caracteres de formula.";
    } else if (!textPattern.test(payload[field])) {
      errors[field] = "Usa solo letras, numeros y signos comerciales basicos.";
    }
  }

  if (!payload.email) {
    errors.email = "Campo obligatorio.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = "Ingresa un correo valido.";
  }

  const normalizedPhone = normalizeTelefono(form.telefono);
  if (normalizedPhone) {
    if (normalizedPhone.length < fieldLimits.telefono) {
      errors.telefono = "Ingresa exactamente 8 digitos despues de +569.";
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    payload: {
      ...payload,
      telefono: normalizedPhone.slice(0, 8) || null,
    },
  };
}
