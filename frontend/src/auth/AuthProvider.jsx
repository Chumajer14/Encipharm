import { useCallback, useEffect, useMemo, useState } from "react";
import {
  onIdTokenChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  isFirebaseConfigured,
} from "../services/firebase";
import { loginWithBackend, updateCurrentUserTemporaryRole } from "../services/api";
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
    return "Firebase autentico, pero el frontend no pudo conectar con el backend. Revisa que la API este corriendo y que CORS permita el origen actual.";
  }

  return authError?.message || "No se pudo iniciar sesion.";
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
        setFirebaseUser(null);
        setBackendUser(null);
        setIdToken(null);
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const syncedUser = await loginWithBackend(token);
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
      setError("Firebase no esta configurado en frontend/.env");
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
      updateTemporaryRole,
    }),
    [backendUser, error, firebaseUser, idToken, loading, updateTemporaryRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
