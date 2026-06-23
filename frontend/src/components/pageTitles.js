const PAGE_TITLES = [
  { pattern: /^\/login\/?$/, title: "Acceso | Enci" },
  { pattern: /^\/dashboard\/?$/, title: "Enci Sales Command" },
  { pattern: /^\/clientes\/?$/, title: "CRM Clientes | Enci" },
  { pattern: /^\/clientes\/[^/]+\/?$/, title: "Detalle de cliente | Enci" },
  { pattern: /^\/crear\/?$/, title: "Nuevo cliente | Enci" },
  { pattern: /^\/interacciones\/?$/, title: "Interacciones | Enci" },
  { pattern: /^\/oportunidades\/?$/, title: "Pipeline y oportunidades | Enci" },
  { pattern: /^\/oportunidades\/[^/]+\/?$/, title: "Detalle de oportunidad | Enci" },
  { pattern: /^\/propuestas\/?$/, title: "Propuestas | Enci" },
  { pattern: /^\/proyecciones\/?$/, title: "Proyecciones | Enci" },
  { pattern: /^\/equipo\/?$/, title: "Equipo de ventas | Enci" },
  { pattern: /^\/inteligencia\/?$/, title: "Inteligencia de mercado | Enci" },
  { pattern: /^\/asistente\/?$/, title: "Enci Chat" },
  { pattern: /^\/competencia\/?$/, title: "Análisis de competencia | Enci" },
  { pattern: /^\/configuracion\/?$/, title: "Configuración | Enci" },
];

/**
 * Obtiene el título de pestaña correspondiente a una ruta del CRM.
 *
 * @param {string} pathname Ruta actual del navegador.
 * @returns {string} Título descriptivo de la vista.
 */
export function resolvePageTitle(pathname) {
  return PAGE_TITLES.find(({ pattern }) => pattern.test(pathname))?.title ?? "Página no encontrada | Enci";
}
