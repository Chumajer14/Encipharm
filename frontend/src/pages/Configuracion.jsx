import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authContext";
import { getUsers, updateUserRole, updateUserStatus } from "../services/api";
import { initials, matchText } from "../utils/commercialAnalytics";

function Configuracion() {
  const { backendUser, idToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const canEdit = backendUser?.rol === "admin";

  useEffect(() => {
    async function loadUsers() {
      if (!idToken) return;
      try {
        setUsers(await getUsers(idToken));
      } catch (loadError) {
        setError(loadError?.message || "No se pudieron cargar usuarios.");
      }
    }

    loadUsers();
  }, [idToken]);

  const visibleUsers = useMemo(
    () => users.filter((user) => matchText(user, query, ["nombre", "email", "rol"])),
    [query, users],
  );

  const updateRole = async (user, rol) => {
    const updated = await updateUserRole(idToken, user.uid, rol);
    setUsers(users.map((item) => item.uid === updated.uid ? updated : item));
  };

  const updateStatus = async (user) => {
    const updated = await updateUserStatus(idToken, user.uid, !user.activo);
    setUsers(users.map((item) => item.uid === updated.uid ? updated : item));
  };

  return (
    <main className="page config-content">
      <aside className="config-sidebar">
        <button className="config-tab active" type="button">Usuarios</button>
        <button className="config-tab" type="button">Apariencia</button>
        <button className="config-tab" type="button">Idioma</button>
      </aside>

      <section className="config-main card command-card">
        <div className="config-panel-title">Gestion de Usuarios</div>
        <p className="config-panel-sub">Administra integrantes, roles y permisos de acceso.</p>
        {error && <section className="notice notice-error"><strong>Error</strong><span>{error}</span></section>}
        <div className="users-toolbar">
          <div className="users-search"><input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar usuario..." value={query} /></div>
        </div>
        <table className="users-table">
          <thead><tr><th>Usuario</th><th>Rol</th><th>App Movil</th><th>Web App</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {visibleUsers.map((user) => (
              <tr key={user.uid}>
                <td><div className="user-cell"><span className="user-cell-avatar">{initials(user.nombre || user.email)}</span><div><strong>{user.nombre}</strong><small>{user.email}</small></div></div></td>
                <td>
                  <select disabled={!canEdit} onChange={(event) => updateRole(user, event.target.value)} value={user.rol}>
                    <option value="vendedor">Vendedor</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
                <td><span className="toggle on" /></td>
                <td><span className="toggle on" /></td>
                <td><span className={`role-badge ${user.activo ? "admin" : "viewer"}`}>{user.activo ? "Activo" : "Inactivo"}</span></td>
                <td><button disabled={!canEdit} onClick={() => updateStatus(user)} type="button">{user.activo ? "Desactivar" : "Activar"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default Configuracion;
