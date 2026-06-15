import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import { auth, getFirebaseConfigHelpMessage, isFirebaseConfigured } from "./services/firebase";
import { loginBackend } from "./services/api";

import BottomNav from "./components/BottomNav";
import { useAppSettings } from "./settings/AppSettings";
import Configuracion from "./pages/Configuracion";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import NuevaCotizacion from "./pages/NuevaCotizacion";
import Pipeline from "./pages/Pipeline";
import Proyeccion from "./pages/Proyeccion";
import "./App.css";

function App() {
  const { t } = useAppSettings();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(Boolean(auth));
  const [authError, setAuthError] = useState(auth ? "" : getFirebaseConfigHelpMessage());

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      try {
        if (!usuario) {
          setUser(null);
          setToken(null);
          setCargando(false);
          return;
        }

        const idToken = await usuario.getIdToken();
        await loginBackend(idToken);

        setUser(usuario);
        setToken(idToken);
        setAuthError("");
      } catch (error) {
        console.error("Error autenticando contra backend:", error);
        setUser(null);
        setToken(null);
        setAuthError(error.message || t("No se pudo validar la sesion."));
      } finally {
        setCargando(false);
      }
    });

    return () => unsubscribe();
  }, [t]);

  if (cargando) {
    return <main className="app-shell">{t("Cargando sesion...")}</main>;
  }

  if (!user || !token) {
    return <Login authError={authError} isFirebaseConfigured={isFirebaseConfigured} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio user={user} />} />
        <Route path="/cotizacion" element={<NuevaCotizacion token={token} />} />
        <Route path="/proyeccion" element={<Proyeccion token={token} />} />
        <Route path="/pipeline" element={<Pipeline token={token} />} />
        <Route path="/configuracion" element={<Configuracion user={user} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <BottomNav />
    </BrowserRouter>
  );
}

export default App;
