import { useState } from "react";
import { useAuth } from "../auth/authContext";
import { getRoleLabel } from "../auth/roles";
import { useI18n } from "../i18n/useI18n";

const TEST_ROLES = [
  { label: "Vendedor", value: "vendedor" },
  { label: "Administrador", value: "admin" },
];

function TemporaryRoleSwitcher() {
  const { backendUser, updateTemporaryRole } = useAuth();
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [savingRole, setSavingRole] = useState("");

  const currentRole = backendUser?.rol || "vendedor";
  const currentRoleLabel = getRoleLabel(currentRole);

  const handleRoleChange = async (rol) => {
    setError("");
    setSavingRole(rol);

    try {
      await updateTemporaryRole(rol);
    } catch (roleError) {
      setError(roleError?.message || "No se pudo cambiar el rol temporal.");
    } finally {
      setSavingRole("");
    }
  };

  return (
    <aside className="temporary-role-box" aria-label="Cambio temporal de permisos">
      <div>
        <strong>{t("TEMPORAL - TEMPORAL")}</strong>
        <span>
          {t("Control solo para pruebas. Cambia los permisos de esta cuenta y debe eliminarse antes de entregar el sistema final.")}
        </span>
      </div>

      <div className="temporary-role-actions">
        {TEST_ROLES.map((role) => (
          <button
            className={currentRole === role.value ? "active-role" : ""}
            disabled={savingRole !== ""}
            key={role.value}
            onClick={() => handleRoleChange(role.value)}
            type="button"
          >
            {savingRole === role.value ? t("Aplicando...") : t(role.label)}
          </button>
        ))}
      </div>

      <small>{t("Rol actual:")} {currentRoleLabel}</small>
      {error && <small className="temporary-role-error">{error}</small>}
    </aside>
  );
}

export default TemporaryRoleSwitcher;
