import { useCallback, useEffect, useMemo, useState } from "react";
import {
  onIdTokenChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  auth,
  getFirebaseConfigHelpMessage,
  googleProvider,
  isFirebaseConfigured,
} from "../services/firebase";
import { translateStaticDom } from "../i18n/useI18n";
import { clearApiGetCache, loginWithBackend, updateCurrentUserPreferences, updateCurrentUserTemporaryRole } from "../services/api";
import { AuthContext } from "./authContext";

function friendlyAuthError(authError) {
  const code = authError?.code;

  if (code === "auth/unauthorized-domain") {
    return "Este dominio no esta autorizado en Firebase Auth. Agrega localhost y 127.0.0.1 en Firebase Console > Authentication > Settings > Authorized domains.";
  }

  if (code === "auth/popup-closed-by-user") {
    return "La ventana de Google se cerro antes de completar el login.";
  }

  if (code === "auth/operation-not-allowed") {
    return "El proveedor Google no esta habilitado en Firebase Authentication.";
  }

  if (authError?.message?.includes("Failed to fetch")) {
    return "Firebase autentico, pero el backend aun no respondio. En el ambiente gratuito puede tardar cerca de 40 segundos en encender; actualiza la pagina e intenta nuevamente.";
  }

  return authError?.message || "No se pudo iniciar sesion.";
}

function ensureWebAccess(user) {
  if (user?.rol === "sin_acceso") {
    throw new Error("Tu cuenta no tiene un rol habilitado en el sistema web.");
  }

  if (user?.webApp === false) {
    throw new Error("Tu cuenta no tiene acceso habilitado al sistema web.");
  }
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [loading, setLoading] = useState(Boolean(auth));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    return onIdTokenChanged(auth, async (user) => {
      setLoading(true);

      if (!user) {
        clearApiGetCache();
        setFirebaseUser(null);
        setBackendUser(null);
        setIdToken(null);
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const syncedUser = await loginWithBackend(token);
        ensureWebAccess(syncedUser);
        setFirebaseUser(user);
        setBackendUser(syncedUser);
        setIdToken(token);
        setError("");
      } catch (syncError) {
        setFirebaseUser(null);
        setBackendUser(null);
        setIdToken(null);
        setError(friendlyAuthError(syncError));
        await firebaseSignOut(auth);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    const language = backendUser?.language || "es";
    let animationFrameId = 0;

    document.documentElement.dataset.theme = backendUser?.theme || "dark";
    document.documentElement.lang = language;

    const translateCurrentView = () => {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => translateStaticDom(language));
    };

    translateCurrentView();

    const observer = new MutationObserver(translateCurrentView);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [backendUser?.theme, backendUser?.language]);

  useEffect(() => {
    async function handleAuthExpired() {
      setError("Tu sesion expiro. Ingresa nuevamente.");
      if (auth) {
        await firebaseSignOut(auth);
      }
    }

    window.addEventListener("enci:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("enci:auth-expired", handleAuthExpired);
  }, []);

  const login = async () => {
    if (!auth) {
      setError(getFirebaseConfigHelpMessage());
      return;
    }

    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (loginError) {
      setError(friendlyAuthError(loginError));
    }
  };

  const logout = async () => {
    clearApiGetCache();
    if (auth) {
      await firebaseSignOut(auth);
    }
  };

  const updateTemporaryRole = useCallback(async (rol) => {
    if (!idToken) {
      throw new Error("No hay sesion activa para cambiar el rol temporal.");
    }

    const updatedUser = await updateCurrentUserTemporaryRole(idToken, rol);
    setBackendUser(updatedUser);
    return updatedUser;
  }, [idToken]);

  const updatePreferences = useCallback(async (preferences) => {
    if (!idToken) {
      throw new Error("No hay sesion activa para actualizar preferencias.");
    }

    const previousUser = backendUser;
    const optimisticUser = { ...backendUser, ...preferences };
    setBackendUser(optimisticUser);
    document.documentElement.dataset.theme = optimisticUser.theme || "dark";
    document.documentElement.lang = optimisticUser.language || "es";
    translateStaticDom(optimisticUser.language || "es");

    try {
      const updatedUser = await updateCurrentUserPreferences(idToken, preferences);
      setBackendUser(updatedUser);
      return updatedUser;
    } catch (preferenceError) {
      setBackendUser(previousUser);
      document.documentElement.dataset.theme = previousUser?.theme || "dark";
      document.documentElement.lang = previousUser?.language || "es";
      translateStaticDom(previousUser?.language || "es");
      throw preferenceError;
    }
  }, [backendUser, idToken]);

  const value = useMemo(
    () => ({
      backendUser,
      error,
      firebaseUser,
      idToken,
      isAuthenticated: Boolean(firebaseUser && backendUser && idToken),
      isFirebaseConfigured,
      loading,
      login,
      logout,
      updatePreferences,
      updateTemporaryRole,
    }),
    [backendUser, error, firebaseUser, idToken, loading, updatePreferences, updateTemporaryRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
