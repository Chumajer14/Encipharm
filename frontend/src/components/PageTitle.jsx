import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { resolvePageTitle } from "./pageTitles";

/** Sincroniza el título de la pestaña con la ruta activa del CRM. */
function PageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = resolvePageTitle(pathname);
  }, [pathname]);

  return null;
}

export default PageTitle;
