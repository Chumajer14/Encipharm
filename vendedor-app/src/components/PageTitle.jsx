import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PAGE_TITLES = [
  { pattern: /^\/$/, title: "Enci Sales Command" },
  { pattern: /^\/cotizacion\/?$/, title: "Nueva cotización | Enci" },
  { pattern: /^\/proyeccion\/?$/, title: "Proyección de ventas | Enci" },
  { pattern: /^\/enci-chat\/?$/, title: "Enci Chat" },
  { pattern: /^\/ia-rag\/?$/, title: "Enci Chat" },
  { pattern: /^\/pipeline\/?$/, title: "Pipeline | Enci" },
  { pattern: /^\/configuracion\/?$/, title: "Configuración | Enci" },
];

/**
 * Obtiene el título de pestaña correspondiente a una ruta de la aplicación móvil.
 *
 * @param {string} pathname Ruta actual del navegador.
 * @returns {string} Título descriptivo de la vista.
 */
function resolvePageTitle(pathname) {
  return PAGE_TITLES.find(({ pattern }) => pattern.test(pathname))?.title ?? "Enci Sales Command";
}

/** Sincroniza el título de la pestaña con la ruta activa de la aplicación móvil. */
function PageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = resolvePageTitle(pathname);
  }, [pathname]);

  return null;
}

export default PageTitle;
