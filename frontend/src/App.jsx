import { Toaster } from "react-hot-toast";
import SSEListener from "./components/SSEListener";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import PagoFinalizado from "./pages/PagoFinalizado";

function App() {
  return (
    <Router>
      <Toaster />
      <SSEListener />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pago-finalizado" element={<PagoFinalizado />} />
      </Routes>
    </Router>
  );
}

export default App;
