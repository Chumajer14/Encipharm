import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import PageTitle from "./components/PageTitle";
import "./App.css";

const Clientes = lazy(() => import("./pages/Clientes"));
const ClienteDetalle = lazy(() => import("./pages/ClienteDetalle"));
const CrearCliente = lazy(() => import("./pages/CrearCliente"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Interacciones = lazy(() => import("./pages/Interacciones"));
const Oportunidades = lazy(() => import("./pages/Oportunidades"));
const OportunidadDetalle = lazy(() => import("./pages/OportunidadDetalle"));
const Propuestas = lazy(() => import("./pages/Propuestas"));
const Proyecciones = lazy(() => import("./pages/Proyecciones"));
const EquipoVentas = lazy(() => import("./pages/EquipoVentas"));
const InteligenciaMercado = lazy(() => import("./pages/InteligenciaMercado"));
const AnalisisCompetencia = lazy(() => import("./pages/AnalisisCompetencia"));
const AsistenteEnci = lazy(() => import("./pages/AsistenteEnci"));
const Configuracion = lazy(() => import("./pages/Configuracion"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageFallback() {
  return (
    <main className="page">
      <section className="card">
        <p className="status-message">Cargando vista...</p>
      </section>
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PageTitle />
        <Suspense fallback={<PageFallback />}>
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
                <ProtectedRoute minimumRole="supervisor">
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
              path="/asistente"
              element={
                <ProtectedRoute>
                  <AsistenteEnci />
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
