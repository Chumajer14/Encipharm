import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import Clientes from "./pages/Clientes";
import CrearCliente from "./pages/CrearCliente";
import Login from "./pages/Login";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Clientes />
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
