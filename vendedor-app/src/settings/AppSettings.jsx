/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "enci-mobile-settings";
const DEFAULT_SETTINGS = {
  language: "es",
  theme: "dark",
};

const DICTIONARY = {
  en: {
    "Acceso vendedor": "Seller access",
    "Actualizacion": "Refresh",
    "Calculado por probabilidad": "Calculated by probability",
    "Calificacion": "Qualification",
    "Campo": "Field",
    "Carga comercial": "Commercial entry",
    "Cargando sesion...": "Loading session...",
    "Cerrar sesion": "Sign out",
    "Cierre": "Closed",
    "Cliente": "Client",
    "Cliente sin nombre": "Unnamed client",
    "Comentario": "Comment",
    "Configuracion": "Settings",
    "Configura las variables VITE_FIREBASE_* antes de desplegar.": "Configure VITE_FIREBASE_* variables before deploying.",
    "Cotizacion creada desde app vendedor": "Quote created from seller app",
    "Cotizacion guardada y enviada al dashboard.": "Quote saved and sent to the dashboard.",
    "Cotizaciones recientes": "Recent quotes",
    "Crear oportunidad": "Create opportunity",
    "Crear propuesta comercial": "Create commercial proposal",
    "Cuenta y sesion": "Account and session",
    "Cuenta y sincronizacion": "Account and sync",
    "Datos": "Data",
    "Enci Sales Command": "Enci Sales Command",
    "Error al guardar cotizacion.": "Error saving quote.",
    "Etapa": "Stage",
    "Forecast comercial del vendedor": "Seller commercial forecast",
    "Forecast ponderado": "Weighted forecast",
    "Fondo de la app": "App theme",
    "Gestiona cotizaciones, pipeline y forecast desde terreno.": "Manage quotes, pipeline and forecast from the field.",
    "Gestionar etapas": "Manage stages",
    "Guardar cotizacion": "Save quote",
    "Idioma": "Language",
    "Ingles": "English",
    "Inicio": "Home",
    "Iniciar sesion con Google": "Sign in with Google",
    "La etapa quedo local. Reintenta cuando el backend este disponible.": "The stage was saved locally. Retry when the backend is available.",
    "Las oportunidades se envian al backend y el dashboard web se revalida automaticamente.": "Opportunities are sent to the backend and the web dashboard revalidates automatically.",
    "Los datos quedan disponibles para el dashboard y forecast.": "Data becomes available for the dashboard and forecast.",
    "Modo": "Mode",
    "Mostrando datos locales. No se pudo sincronizar con backend.": "Showing local data. Could not sync with backend.",
    "Monto": "Amount",
    "Monto cotizado": "Quoted amount",
    "Nueva Cotizacion": "New quote",
    "Nueva cotizacion": "New quote",
    "Negociacion": "Negotiation",
    "No se pudieron cargar clientes desde el backend.": "Could not load clients from the backend.",
    "No se pudo iniciar sesion": "Could not sign in",
    "No se pudo validar la sesion.": "Could not validate the session.",
    "Nocturno": "Dark",
    "Online": "Online",
    "Oportunidad": "Opportunity",
    "Pendiente de sincronizar": "Pending sync",
    "Perdido": "Lost",
    "Pipeline bruto": "Gross pipeline",
    "Pond.": "Weighted",
    "Portugues": "Portuguese",
    "Prob.": "Prob.",
    "Probabilidad de exito": "Success probability",
    "Probabilidad:": "Probability:",
    "Producto": "Product",
    "Producto no seleccionado": "No product selected",
    "Proximos pasos o comentario comercial...": "Next steps or commercial comment...",
    "Prospeccion": "Prospecting",
    "Propuesta": "Proposal",
    "Proyeccion": "Forecast",
    "Proyeccion ponderada": "Weighted forecast",
    "Registra cotizaciones y consulta el pipeline desde terreno con sincronizacion directa al dashboard.": "Create quotes and check the pipeline from the field with direct dashboard sync.",
    "Registra una cotizacion para calcular tu proyeccion.": "Create a quote to calculate your forecast.",
    "Selecciona cliente": "Select client",
    "Selecciona producto": "Select product",
    "Sesion activa": "Active session",
    "Sin cotizaciones": "No quotes",
    "Sin oportunidades en esta etapa.": "No opportunities in this stage.",
    "Sincronizacion activa": "Sync active",
    "Tema claro": "Light",
    "Usuario": "User",
    "Vendedor": "Seller",
    "cotizaciones activas": "active quotes",
    "oportunidades": "opportunities",
    "1 oportunidad": "1 opportunity",
  },
  pt: {
    "Acceso vendedor": "Acesso vendedor",
    "Actualizacion": "Atualizacao",
    "Calculado por probabilidad": "Calculado por probabilidade",
    "Calificacion": "Qualificacao",
    "Campo": "Campo",
    "Carga comercial": "Carga comercial",
    "Cargando sesion...": "Carregando sessao...",
    "Cerrar sesion": "Encerrar sessao",
    "Cierre": "Fechamento",
    "Cliente": "Cliente",
    "Cliente sin nombre": "Cliente sem nome",
    "Comentario": "Comentario",
    "Configuracion": "Configuracao",
    "Configura las variables VITE_FIREBASE_* antes de desplegar.": "Configure as variaveis VITE_FIREBASE_* antes de publicar.",
    "Cotizacion creada desde app vendedor": "Cotacao criada pelo app vendedor",
    "Cotizacion guardada y enviada al dashboard.": "Cotacao salva e enviada ao dashboard.",
    "Cotizaciones recientes": "Cotacoes recentes",
    "Crear oportunidad": "Criar oportunidade",
    "Crear propuesta comercial": "Criar proposta comercial",
    "Cuenta y sesion": "Conta e sessao",
    "Cuenta y sincronizacion": "Conta e sincronizacao",
    "Datos": "Dados",
    "Enci Sales Command": "Enci Sales Command",
    "Error al guardar cotizacion.": "Erro ao salvar cotacao.",
    "Etapa": "Etapa",
    "Forecast comercial del vendedor": "Forecast comercial do vendedor",
    "Forecast ponderado": "Forecast ponderado",
    "Fondo de la app": "Tema do app",
    "Gestiona cotizaciones, pipeline y forecast desde terreno.": "Gerencie cotacoes, pipeline e forecast em campo.",
    "Gestionar etapas": "Gerenciar etapas",
    "Guardar cotizacion": "Salvar cotacao",
    "Idioma": "Idioma",
    "Ingles": "Ingles",
    "Inicio": "Inicio",
    "Iniciar sesion con Google": "Entrar com Google",
    "La etapa quedo local. Reintenta cuando el backend este disponible.": "A etapa ficou local. Tente novamente quando o backend estiver disponivel.",
    "Las oportunidades se envian al backend y el dashboard web se revalida automaticamente.": "As oportunidades sao enviadas ao backend e o dashboard web revalida automaticamente.",
    "Los datos quedan disponibles para el dashboard y forecast.": "Os dados ficam disponiveis para o dashboard e forecast.",
    "Modo": "Modo",
    "Mostrando datos locales. No se pudo sincronizar con backend.": "Mostrando dados locais. Nao foi possivel sincronizar com o backend.",
    "Monto": "Valor",
    "Monto cotizado": "Valor cotado",
    "Nueva Cotizacion": "Nova cotacao",
    "Nueva cotizacion": "Nova cotacao",
    "Negociacion": "Negociacao",
    "No se pudieron cargar clientes desde el backend.": "Nao foi possivel carregar clientes do backend.",
    "No se pudo iniciar sesion": "Nao foi possivel iniciar sessao",
    "No se pudo validar la sesion.": "Nao foi possivel validar a sessao.",
    "Nocturno": "Escuro",
    "Online": "Online",
    "Oportunidad": "Oportunidade",
    "Pendiente de sincronizar": "Sincronizacao pendente",
    "Perdido": "Perdido",
    "Pipeline bruto": "Pipeline bruto",
    "Pond.": "Pond.",
    "Portugues": "Portugues",
    "Prob.": "Prob.",
    "Probabilidad de exito": "Probabilidade de sucesso",
    "Probabilidad:": "Probabilidade:",
    "Producto": "Produto",
    "Producto no seleccionado": "Produto nao selecionado",
    "Proximos pasos o comentario comercial...": "Proximos passos ou comentario comercial...",
    "Prospeccion": "Prospeccao",
    "Propuesta": "Proposta",
    "Proyeccion": "Forecast",
    "Proyeccion ponderada": "Forecast ponderado",
    "Registra cotizaciones y consulta el pipeline desde terreno con sincronizacion directa al dashboard.": "Registre cotacoes e consulte o pipeline em campo com sincronizacao direta ao dashboard.",
    "Registra una cotizacion para calcular tu proyeccion.": "Registre uma cotacao para calcular seu forecast.",
    "Selecciona cliente": "Selecione cliente",
    "Selecciona producto": "Selecione produto",
    "Sesion activa": "Sessao ativa",
    "Sin cotizaciones": "Sem cotacoes",
    "Sin oportunidades en esta etapa.": "Sem oportunidades nesta etapa.",
    "Sincronizacion activa": "Sincronizacao ativa",
    "Tema claro": "Claro",
    "Usuario": "Usuario",
    "Vendedor": "Vendedor",
    "cotizaciones activas": "cotacoes ativas",
    "oportunidades": "oportunidades",
    "1 oportunidad": "1 oportunidade",
  },
};

const AppSettingsContext = createContext({
  language: "es",
  setLanguage: () => {},
  setTheme: () => {},
  t: (value) => value,
  theme: "dark",
});

function readSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(readSettings);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.lang = settings.language;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const value = useMemo(() => ({
    language: settings.language,
    setLanguage: (language) => setSettings((current) => ({ ...current, language })),
    setTheme: (theme) => setSettings((current) => ({ ...current, theme })),
    t: (text) => DICTIONARY[settings.language]?.[text] || text,
    theme: settings.theme,
  }), [settings]);

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
