import { BrowserRouter, Routes, Route } from "react-router-dom";
import Clientes from "./pages/Clientes";
import CrearCliente from "./pages/CrearCliente";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Clientes />} />
        <Route path="/crear" element={<CrearCliente />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;