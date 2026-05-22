import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import Clientes from "./pages/Clientes";
import ClienteDetalle from "./pages/ClienteDetalle";
import CrearCliente from "./pages/CrearCliente";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Interacciones from "./pages/Interacciones";
import Oportunidades from "./pages/Oportunidades";
import OportunidadDetalle from "./pages/OportunidadDetalle";
import Propuestas from "./pages/Propuestas";
import Proyecciones from "./pages/Proyecciones";
import EquipoVentas from "./pages/EquipoVentas";
import InteligenciaMercado from "./pages/InteligenciaMercado";
import AnalisisCompetencia from "./pages/AnalisisCompetencia";
import Configuracion from "./pages/Configuracion";
import NotFound from "./pages/NotFound";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />

          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <Clientes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clientes/:clienteId"
            element={
              <ProtectedRoute>
                <ClienteDetalle />
              </ProtectedRoute>
            }
          />

          <Route
            path="/crear"
            element={
              <ProtectedRoute>
                <CrearCliente />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute minimumRole="vendedor">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interacciones"
            element={
              <ProtectedRoute>
                <Interacciones />
              </ProtectedRoute>
            }
          />

          <Route
            path="/oportunidades"
            element={
              <ProtectedRoute>
                <Oportunidades />
              </ProtectedRoute>
            }
          />

          <Route
            path="/oportunidades/:oportunidadId"
            element={
              <ProtectedRoute>
                <OportunidadDetalle />
              </ProtectedRoute>
            }
          />

          <Route
            path="/propuestas"
            element={
              <ProtectedRoute>
                <Propuestas />
              </ProtectedRoute>
            }
          />

          <Route
            path="/proyecciones"
            element={
              <ProtectedRoute>
                <Proyecciones />
              </ProtectedRoute>
            }
          />

          <Route
            path="/equipo"
            element={
              <ProtectedRoute>
                <EquipoVentas />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inteligencia"
            element={
              <ProtectedRoute>
                <InteligenciaMercado />
              </ProtectedRoute>
            }
          />

          <Route
            path="/competencia"
            element={
              <ProtectedRoute>
                <AnalisisCompetencia />
              </ProtectedRoute>
            }
          />

          <Route
            path="/configuracion"
            element={
              <ProtectedRoute minimumRole="vendedor">
                <Configuracion />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
