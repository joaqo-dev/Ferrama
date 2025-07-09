import { Toaster } from "react-hot-toast";
import SSEListener from "./components/SSEListener";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import PagoFinalizado from "./pages/PagoFinalizado";
import CrearProductoPage from "./pages/CrearProductoPage";

function App() {
  return (
    <Router>
      <Toaster />
      <SSEListener />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pago-finalizado" element={<PagoFinalizado />} />
        <Route path="/productos/crear" element={<CrearProductoPage />} />
      </Routes>
    </Router>
  );
}

export default App;
