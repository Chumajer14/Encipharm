import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import { auth, getFirebaseConfigHelpMessage, isFirebaseConfigured } from "./services/firebase";
import { loginBackend } from "./services/api";

import BottomNav from "./components/BottomNav";
import PageTitle from "./components/PageTitle";
import { useAppSettings } from "./settings/AppSettings";
import { ensureMobileAccess } from "./utils/access";
import Configuracion from "./pages/Configuracion";
import EnciChat from "./pages/EnciChat";
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
        const backendUser = await loginBackend(idToken);
        ensureMobileAccess(backendUser);

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

  useEffect(() => {
    if (cargando) {
      document.title = "Cargando | Enci";
    } else if (!user || !token) {
      document.title = "Acceso vendedor | Enci";
    }
  }, [cargando, token, user]);

  if (cargando) {
    return <main className="app-shell">{t("Cargando sesion...")}</main>;
  }

  if (!user || !token) {
    return <Login authError={authError} isFirebaseConfigured={isFirebaseConfigured} />;
  }

  return (
    <BrowserRouter>
      <PageTitle />
      <Routes>
        <Route path="/" element={<Inicio user={user} />} />
        <Route path="/cotizacion" element={<NuevaCotizacion token={token} />} />
        <Route path="/proyeccion" element={<Proyeccion token={token} />} />
        <Route path="/enci-chat" element={<EnciChat token={token} />} />
        <Route path="/ia-rag" element={<Navigate to="/enci-chat" replace />} />
        <Route path="/pipeline" element={<Pipeline token={token} />} />
        <Route path="/configuracion" element={<Configuracion user={user} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <BottomNav />
    </BrowserRouter>
  );
}

export default App;
