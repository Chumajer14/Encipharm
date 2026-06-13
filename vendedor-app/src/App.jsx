import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import { auth } from "./services/firebase";
import { loginBackend } from "./services/api";

import NuevaCotizacion from "./pages/NuevaCotizacion";
import Proyeccion from "./pages/Proyeccion";
import Cotizaciones from "./pages/Cotizaciones";
import Pipeline from "./pages/Pipeline";
import Login from "./pages/Login";
import BottomNav from "./components/BottomNav";
import "./App.css";

import Inicio from "./pages/Inicio";
import Configuracion from "./pages/Configuracion";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
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
      } catch (error) {
        console.error("Error autenticando contra backend:", error);
        setUser(null);
        setToken(null);
      } finally {
        setCargando(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (cargando) {
    return <main className="app-shell">Cargando sesión...</main>;
  }

  if (!user || !token) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<Inicio user={user} />} />
      <Route path="/cotizacion" element={<NuevaCotizacion token={token} />} />
      <Route path="/proyeccion" element={<Proyeccion />} />
      <Route path="/pipeline" element={<Pipeline />} />
      <Route path="/configuracion" element={<Configuracion user={user} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>

      <BottomNav />
    </BrowserRouter>
  );
}

export default App;