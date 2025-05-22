// src/pages/Home.jsx (NUEVO ARCHIVO)
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ProductoSelector from "../components/ProductoSelector";
import SucursalList from "../components/SucursalList";
import CantidadSelector from "../components/CantidadSelector";
import AccionesCompra from "../components/AccionesCompra";
import ResultadoCompra from "../components/ResultadoCompra";
import ErrorAlerta from "../components/ErrorAlerta";

function Home() {
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/productos")
      .then((res) => setProductos(res.data))
      .catch(() => setError("No se pudieron cargar los productos"));
  }, []);

  const buscarSucursales = () => {
    if (!productoSeleccionado) return;
    setSucursales([]);
    setSucursalSeleccionada(null);
    setResultado(null);

    axios
      .get(
        `http://localhost:3000/api/productos/${productoSeleccionado}/sucursales`
      )
      .then((res) => setSucursales(res.data))
      .catch(() => setError("Error al buscar sucursales"));
  };

  const calcularTotal = () => {
    if (!productoSeleccionado || !sucursalSeleccionada || cantidad <= 0) return;

    axios
      .post("http://localhost:3000/api/compras/calcular", {
        producto_id: productoSeleccionado,
        sucursal_id: sucursalSeleccionada,
        cantidad,
      })
      .then((res) => {
        setResultado(res.data);
        setError("");
      })
      .catch((err) => {
        setResultado(null);
        setError(err.response?.data?.error || "Error al calcular");
      });
  };

  const realizarCompra = () => {
    if (
      !productoSeleccionado ||
      !sucursalSeleccionada ||
      cantidad <= 0 ||
      !resultado
    ) {
      setError(
        "Por favor, selecciona un producto, sucursal, cantidad y calcula el total antes de comprar."
      );
      return;
    }

    const buyOrder = `ORDEN_${Date.now()}`;
    const sessionId = `SESION_${Date.now()}`;
    const amount = resultado.total_clp;

    axios
      .post("http://localhost:3000/api/webpay/crear", {
        buyOrder,
        sessionId,
        amount,
        producto_id: productoSeleccionado,
        sucursal_id: sucursalSeleccionada,
        cantidad_comprada: cantidad,
      })
      .then((res) => {
        const { token, url } = res.data;

        const form = document.createElement("form");
        form.method = "POST";
        form.action = url;

        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "token_ws";
        input.value = token;
        form.appendChild(input);

        document.body.appendChild(form);
        form.submit();
      })
      .catch((err) => {
        console.error(
          "Error al iniciar la transacción con Transbank:",
          err.response?.data || err
        );
        setError(
          err.response?.data?.error ||
            "No se pudo iniciar la transacción con Transbank"
        );
      });
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-6 p-6 bg-zinc-800 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-semibold text-center">FerraMas 🛠️</h1>

        <ProductoSelector
          productos={productos}
          onSelect={setProductoSeleccionado}
          onBuscar={buscarSucursales}
        />

        <SucursalList
          sucursales={sucursales}
          seleccionada={sucursalSeleccionada}
          onSelect={setSucursalSeleccionada}
        />

        <div className="space-y-3">
          <CantidadSelector cantidad={cantidad} setCantidad={setCantidad} />
          <AccionesCompra
            onCalcular={calcularTotal}
            onComprar={realizarCompra}
          />
        </div>

        <ResultadoCompra resultado={resultado} />
        <ErrorAlerta mensaje={error} />
      </div>
    </div>
  );
}

export default Home;
