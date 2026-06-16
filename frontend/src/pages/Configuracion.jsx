import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import { hasMinimumRole } from "../auth/roles";
import LoadingState from "../components/LoadingState";
import { useI18n } from "../i18n/useI18n";
import { getUsers, updateUser, updateUserStatus } from "../services/api";
import { initials, matchText } from "../utils/commercialAnalytics";

const RANKS = ["Sin acceso", "Solo lectura", "Vendedor", "Gerente", "Administrador"];
const ZONES = ["Zona norte", "Zona centro", "Zona sur", "Zona oriente"];
const RANK_TO_ROLE = {
  "Sin acceso": "sin_acceso",
  "Solo lectura": "vendedor",
  Vendedor: "vendedor",
  Gerente: "supervisor",
  Administrador: "admin",
};
const AVATAR_COLORS = [
  "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  "linear-gradient(135deg,#10b981,#34d399)",
  "linear-gradient(135deg,#f59e0b,#fbbf24)",
  "linear-gradient(135deg,#ef4444,#f87171)",
  "linear-gradient(135deg,#3b82f6,#60a5fa)",
  "linear-gradient(135deg,#6366f1,#818cf8)",
];

function rankFromUser(user) {
  if (user.rango) return user.rango;
  if (user.rol === "sin_acceso") return "Sin acceso";
  if (user.rol === "admin") return "Administrador";
  if (user.rol === "supervisor") return "Gerente";
  return user.cargo || "Vendedor";
}

function ConfigIcon({ type }) {
  const paths = {
    users: "M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    sun: "M12 3v1m0 16v1m8.66-13.66-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 7.66-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
    lang: "M3 5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l2.414 2.414a1 1 0 0 0 .707.293H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z M8 9l3 3m0 0 3 3m-3-3 3-3m-3 3L8 9m13 4h-8m4-4v8",
    search: "m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
    plus: "M12 4v16m8-8H4",
    edit: "M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586Z",
    trash: "m19 7-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16",
    close: "M6 18 18 6M6 6l12 12",
    warning: "M12 9v3m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
  };
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d={paths[type]} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function Configuracion() {
  const { backendUser, idToken, updatePreferences } = useAuth();
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("usuarios");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [savingUser, setSavingUser] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", rango: "Vendedor", zona: "Zona centro", appMovil: true, webApp: true, activo: true });
  const canEdit = backendUser?.rol === "admin";
  const canViewUsers = hasMinimumRole(backendUser?.rol, "supervisor");
  const selectedTheme = backendUser?.theme || "dark";
  const selectedLanguage = backendUser?.language || "es";

  useEffect(() => {
    async function loadUsers() {
      if (!idToken || !canViewUsers) return;
      try {
        setLoadingUsers(true);
        setUsers(await getUsers(idToken, { limit: 500 }));
      } catch (loadError) {
        setError(loadError?.message || "No se pudieron cargar usuarios.");
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, [canViewUsers, idToken]);

  const visibleUsers = useMemo(
    () => users.filter((user) => matchText({ ...user, rango: rankFromUser(user) }, query, ["nombre", "email", "rol", "rango", "zona"])),
    [query, users],
  );
  const effectiveActiveTab = canViewUsers || activeTab !== "usuarios" ? activeTab : "apariencia";

  const updateLocalUser = (updated) => setUsers(users.map((item) => item.uid === updated.uid ? updated : item));

  const patchUser = async (user, changes) => {
    if (!canEdit) return;
    try {
      setError("");
      const updated = await updateUser(idToken, user.uid, changes);
      updateLocalUser(updated);
    } catch (updateError) {
      setError(updateError?.message || "No se pudieron guardar los cambios del usuario.");
    }
  };

  const toggleField = async (user, field) => {
    if (user.rol === "sin_acceso" && user[field] === false) {
      setError("Asigna un rol antes de habilitar accesos a una plataforma.");
      return;
    }
    await patchUser(user, { [field]: !user[field] });
  };

  const toggleStatus = async (user) => {
    if (!canEdit) return;
    try {
      setError("");
      const updated = await updateUserStatus(idToken, user.uid, !user.activo);
      updateLocalUser(updated);
    } catch (statusError) {
      setError(statusError?.message || "No se pudo cambiar el estado del usuario.");
    }
  };

  const openModal = (user = null) => {
    setError("");
    setEditingUser(user);
    setModalOpen(true);
    setForm(user
      ? {
        nombre: user.nombre || "",
        email: user.email || "",
        rango: rankFromUser(user),
        zona: user.zona || "Zona centro",
        appMovil: user.appMovil !== false,
        webApp: user.webApp !== false,
        activo: user.activo !== false,
      }
      : { nombre: "", email: "", rango: "Vendedor", zona: "Zona centro", appMovil: true, webApp: true, activo: true });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setSavingUser(false);
  };

  const saveUser = async () => {
    if (!canEdit) return;
    setError("");
    if (!editingUser) {
      setError("Para agregar un usuario nuevo primero debe existir su cuenta Firebase. Luego podras editarlo en esta tabla.");
      return;
    }
    if (!form.nombre.trim()) {
      setError("El nombre del usuario es obligatorio.");
      return;
    }

    const nextRole = RANK_TO_ROLE[form.rango];
    const platformAccess = nextRole === "sin_acceso"
      ? { appMovil: false, webApp: false }
      : { appMovil: form.appMovil, webApp: form.webApp };

    try {
      setSavingUser(true);
      const updated = await updateUser(idToken, editingUser.uid, {
        nombre: form.nombre,
        rango: form.rango,
        cargo: form.rango,
        zona: form.zona,
        rol: nextRole,
        ...platformAccess,
        activo: form.activo,
      });
      updateLocalUser(updated);
      closeModal();
    } catch (saveError) {
      setError(saveError?.message || "No se pudo guardar el usuario.");
    } finally {
      setSavingUser(false);
    }
  };

  const changeRank = (nextRank) => {
    const nextForm = { ...form, rango: nextRank };
    if (RANK_TO_ROLE[nextRank] === "sin_acceso") {
      nextForm.appMovil = false;
      nextForm.webApp = false;
    }
    setForm(nextForm);
  };

  const savePreference = async (changes) => {
    try {
      setError("");
      await updatePreferences(changes);
    } catch (preferenceError) {
      setError(preferenceError?.message || "No se pudieron guardar las preferencias.");
    }
  };

  const selectTheme = async (nextTheme) => {
    await savePreference({ theme: nextTheme });
  };

  const selectLanguage = async (nextLanguage) => {
    await savePreference({ language: nextLanguage });
  };

  const langNotice = {
    es: "El cambio de idioma ahora se guarda en tu usuario y actualiza la interfaz del sistema al volver a ingresar.",
    en: "The language change is now saved to your user profile and updates the system interface when you sign in again.",
    pt: "A mudança de idioma agora é salva no seu usuário e atualiza a interface do sistema ao entrar novamente.",
  };

  return (
    <main className="page config-content">
      <aside className="config-sidebar">
        {canViewUsers && <button className={`config-tab ${effectiveActiveTab === "usuarios" ? "active" : ""}`} onClick={() => setActiveTab("usuarios")} type="button"><ConfigIcon type="users" />{t("Usuarios")}</button>}
        <button className={`config-tab ${effectiveActiveTab === "apariencia" ? "active" : ""}`} onClick={() => setActiveTab("apariencia")} type="button"><ConfigIcon type="sun" />{t("Apariencia")}</button>
        <button className={`config-tab ${effectiveActiveTab === "idioma" ? "active" : ""}`} onClick={() => setActiveTab("idioma")} type="button"><ConfigIcon type="lang" />{t("Idioma")}</button>
      </aside>

      {canViewUsers && <section className={`config-panel ${effectiveActiveTab === "usuarios" ? "active" : ""}`}>
        <div className="config-panel-title">{t("Gestión de Usuarios")}</div>
        <p className="config-panel-sub">{t("Administra los integrantes del equipo, roles y permisos de acceso")}</p>
        {error && <section className="notice notice-error"><strong>Error</strong><span>{error}</span></section>}
        <div className="users-toolbar">
          <div className="users-search"><ConfigIcon type="search" /><input onChange={(event) => setQuery(event.target.value)} placeholder={t("Buscar usuario...")} value={query} /></div>
          <button className="btn-add-user" disabled={!canEdit} onClick={() => openModal(null)} type="button"><ConfigIcon type="plus" />{t("Agregar Usuario")}</button>
        </div>
        {loadingUsers && <LoadingState />}
        {!loadingUsers && canViewUsers && <table className="users-table">
          <thead><tr><th>{t("Usuario")}</th><th>{t("Rol")}</th><th>{t("Zona")}</th><th>{t("App Movil")}</th><th>{t("Web App")}</th><th>{t("Estado")}</th><th className="text-right">{t("Acciones")}</th></tr></thead>
          <tbody>
            {visibleUsers.map((user, index) => {
              const rank = rankFromUser(user);
              return (
                <tr className={user.rol === "sin_acceso" ? "pending-access-row" : ""} key={user.uid}>
                  <td><div className="user-cell"><span className="user-cell-avatar" style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}>{initials(user.nombre || user.email)}</span><span className="user-cell-info"><strong>{user.nombre}</strong><small>{user.email}</small></span></div></td>
                  <td><span className={`role-badge ${rank.toLowerCase().replaceAll(" ", "-")}`}>{rank}</span></td>
                  <td>{user.zona || "Zona centro"}</td>
                  <td><button aria-label={t("App Movil")} className={`toggle ${user.appMovil !== false ? "on" : ""}`} disabled={!canEdit} onClick={() => toggleField(user, "appMovil")} type="button" /></td>
                  <td><button aria-label={t("Web App")} className={`toggle ${user.webApp !== false ? "on" : ""}`} disabled={!canEdit} onClick={() => toggleField(user, "webApp")} type="button" /></td>
                  <td><div className="toggle-wrap"><button aria-label={t("Estado")} className={`toggle ${user.activo ? "on" : ""}`} disabled={!canEdit} onClick={() => toggleStatus(user)} type="button" /><span className={`toggle-label ${user.activo ? "active" : "inactive"}`}>{user.activo ? t("Activo") : t("Inactivo")}</span></div></td>
                  <td><div className="user-actions"><button className="user-action-btn" disabled={!canEdit} onClick={() => openModal(user)} title={t("Editar")} type="button"><ConfigIcon type="edit" /></button><button className="user-action-btn danger" disabled={!canEdit} onClick={() => patchUser(user, { activo: false })} title={t("Eliminar")} type="button"><ConfigIcon type="trash" /></button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>}
      </section>}

      <section className={`config-panel ${effectiveActiveTab === "apariencia" ? "active" : ""}`}>
        <div className="config-panel-title">{t("Apariencia")}</div>
        <p className="config-panel-sub">{t("Selecciona el tema visual de la aplicación")}</p>
        <div className="appearance-grid">
          {["dark", "light"].map((item) => (
            <button className={`appearance-card ${selectedTheme === item ? "selected" : ""}`} key={item} onClick={() => selectTheme(item)} type="button">
              <span className="appearance-check">OK</span>
              <span className={`appearance-preview ${item}`}><i className="appearance-preview-bar" /><span className="appearance-preview-body"><i className="appearance-preview-sidebar" /><span className="appearance-preview-main"><i className="appearance-preview-line accent" /><i className="appearance-preview-line wide" /><i className="appearance-preview-line mid" /><i className="appearance-preview-line full" /></span></span></span>
              <strong>{item === "dark" ? t("Modo Oscuro") : t("Modo Claro")}</strong>
              <small>{item === "dark" ? t("Tema oscuro por defecto, menor fatiga visual en ambientes con poca luz") : t("Tema claro, ideal para entornos bien iluminados y mayor contraste")}</small>
            </button>
          ))}
        </div>
      </section>

      <section className={`config-panel ${effectiveActiveTab === "idioma" ? "active" : ""}`}>
        <div className="config-panel-title">{t("Idioma")}</div>
        <p className="config-panel-sub">{t("Selecciona el idioma de la interfaz de la aplicación")}</p>
        <div className="lang-grid">
          {[
            ["es", "ES", "Español", "Español"],
            ["en", "EN", "English", "English"],
            ["pt", "PT", "Português", "Português"],
          ].map(([key, flag, label, native]) => (
            <button className={`lang-card ${selectedLanguage === key ? "selected" : ""}`} key={key} onClick={() => selectLanguage(key)} type="button"><span className="lang-check">OK</span><strong>{flag}</strong><span>{label}</span><small>{native}</small></button>
          ))}
        </div>
        <div className="config-note"><ConfigIcon type="warning" /><div><strong>{t("Nota importante")}</strong><p>{langNotice[selectedLanguage]}</p></div></div>
      </section>

      {modalOpen && (
        <div className="user-modal-overlay active" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <div className="user-modal">
            <div className="user-modal-header"><strong>{editingUser ? t("Editar Usuario") : t("Agregar Usuario")}</strong><button className="user-modal-close" onClick={closeModal} type="button"><ConfigIcon type="close" /></button></div>
            <div className="user-modal-body">
              <div className="form-row"><label className="form-group"><span>{t("Nombre")}</span><input className="form-input" onChange={(event) => setForm({ ...form, nombre: event.target.value })} value={form.nombre} /></label><label className="form-group"><span>{t("Correo electronico")}</span><input className="form-input" disabled value={form.email} /></label></div>
              <div className="form-row"><label className="form-group"><span>{t("Rol")}</span><select className="form-select" onChange={(event) => changeRank(event.target.value)} value={form.rango}>{RANKS.map((rank) => <option key={rank}>{rank}</option>)}</select></label><label className="form-group"><span>{t("Zona")}</span><select className="form-select" onChange={(event) => setForm({ ...form, zona: event.target.value })} value={form.zona}>{ZONES.map((zone) => <option key={zone}>{zone}</option>)}</select></label></div>
              <div className="form-row full"><span className="form-label">{t("Privilegios de acceso")}</span><div className="privileges-grid"><button className={`privilege-item ${form.appMovil ? "checked" : ""}`} disabled={RANK_TO_ROLE[form.rango] === "sin_acceso"} onClick={() => setForm({ ...form, appMovil: !form.appMovil })} type="button"><i />{t("App Movil")}<small>{t("Acceso a la aplicacion movil")}</small></button><button className={`privilege-item ${form.webApp ? "checked" : ""}`} disabled={RANK_TO_ROLE[form.rango] === "sin_acceso"} onClick={() => setForm({ ...form, webApp: !form.webApp })} type="button"><i />{t("Web App")}<small>{t("Acceso al Command Center")}</small></button></div></div>
            </div>
            <div className="user-modal-footer"><button className="btn-cancel" disabled={savingUser} onClick={closeModal} type="button">{t("Cancelar")}</button><button className="btn-save" disabled={savingUser} onClick={saveUser} type="button">{savingUser ? t("Guardando...") : t("Guardar Usuario")}</button></div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Configuracion;
