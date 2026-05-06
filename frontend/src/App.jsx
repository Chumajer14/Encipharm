import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import Clientes from "./pages/Clientes";
import ClienteDetalle from "./pages/ClienteDetalle";
import CrearCliente from "./pages/CrearCliente";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Proximamente from "./pages/Proximamente";
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
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interacciones"
            element={
              <ProtectedRoute>
                <Proximamente titulo="Interacciones" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/propuestas"
            element={
              <ProtectedRoute>
                <Proximamente titulo="Propuestas" />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
