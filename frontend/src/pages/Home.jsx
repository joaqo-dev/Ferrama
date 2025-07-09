// frontend/src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ProductoSelector from "../components/ProductoSelector";
import SucursalList from "../components/SucursalList";
import CantidadSelector from "../components/CantidadSelector";
import ErrorAlerta from "../components/ErrorAlerta";
import TotalDisplay from "../components/TotalDisplay";

function Home() {
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [sucursalesDelProducto, setSucursalesDelProducto] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Cargar productos al inicio
  useEffect(() => {
    const fetchProductos = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get("http://localhost:3000/api/productos");
        setProductos(response.data);
      } catch (err) {
        console.error("Error al cargar productos:", err);
        setError("Error al cargar los productos. Por favor, intenta de nuevo.");
        toast.error("Error al cargar productos.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductos();
  }, []);

  // Función para buscar stock por sucursales cuando se selecciona un producto
  const buscarSucursalesPorProducto = async (productId) => {
    if (!productId) {
      setSucursalesDelProducto([]);
      setSucursalSeleccionada(null);
      setTotal(0);
      return;
    }
    setIsLoading(true);
    setError("");
    setSucursalesDelProducto([]);
    setSucursalSeleccionada(null);
    setTotal(0);

    try {
      const response = await axios.get(
        `http://localhost:3000/api/productos/${productId}/sucursales`
      );
      setSucursalesDelProducto(response.data);
      if (response.data.length === 0) {
        toast("No hay stock para este producto en ninguna sucursal.", {
          icon: "ℹ️",
        });
      }
    } catch (err) {
      console.error("Error al buscar sucursales:", err);
      setError(
        "Error al buscar sucursales para el producto seleccionado. Por favor, intenta de nuevo."
      );
      toast.error("Error al buscar sucursales.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productoSeleccionado && productoSeleccionado.id) {
      buscarSucursalesPorProducto(productoSeleccionado.id);
    } else {
      buscarSucursalesPorProducto(null);
    }
  }, [productoSeleccionado]);

  // Función para manejar la selección de un producto del selector
  const handleSelectProducto = (productoObj) => {
    setProductoSeleccionado(productoObj);
    setSucursalSeleccionada(null);
    setCantidad(1);
    setTotal(0);
    setError("");
    toast.success(`Producto ${productoObj.nombre} seleccionado.`);
  };

  const handleSelectSucursal = (sucursal) => {
    setSucursalSeleccionada(sucursal);
    setCantidad(1);
    setTotal(0);
    setError("");
    toast.success(`Sucursal ${sucursal.nombre} seleccionada.`);
  };

  // Función para calcular el total
  const calcularTotal = () => {
    if (!productoSeleccionado || !sucursalSeleccionada || cantidad <= 0) {
      toast.error(
        "Por favor, selecciona un producto, sucursal y cantidad válida."
      );
      return;
    }

    if (cantidad > sucursalSeleccionada.stock) {
      toast.error(
        `La cantidad (${cantidad}) excede el stock disponible en ${sucursalSeleccionada.nombre} (${sucursalSeleccionada.stock}).`
      );
      return;
    }

    const nuevoTotal = cantidad * sucursalSeleccionada.precio;
    setTotal(nuevoTotal);
    setError("");
    toast.success(
      `Total calculado: $${nuevoTotal.toLocaleString("es-CL")} CLP`
    );
  };

  const realizarCompra = () => {
    if (
      !productoSeleccionado ||
      !sucursalSeleccionada ||
      cantidad <= 0 ||
      total <= 0
    ) {
      setError(
        "Por favor, selecciona un producto, sucursal, cantidad y calcula el total antes de comprar."
      );
      return;
    }

    const buyOrder = `ORDEN_${Date.now()}`;
    const sessionId = `SESION_${Date.now()}`;
    const amount = total;

    axios
      .post("http://localhost:3000/api/webpay/crear", {
        buyOrder,
        sessionId,
        amount,
        producto_id: productoSeleccionado.id,
        sucursal_id: sucursalSeleccionada.id,
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
        toast.error("No se pudo iniciar la transacción.");
      });
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl space-y-6 p-6 bg-zinc-800 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-semibold text-center mb-6">FerraMas 🛠️</h1>

        <button
          onClick={() => navigate("/productos/crear")}
          className="bg-emerald-600 hover:bg-emerald-500 transition-colors text-white px-4 py-2 rounded-lg w-full mb-4 font-semibold"
        >
          Crear Nuevo Producto
        </button>

        {isLoading && (
          <div className="text-center text-blue-400">Cargando...</div>
        )}
        <ErrorAlerta mensaje={error} />

        <ProductoSelector
          productos={productos}
          onSelect={handleSelectProducto}
          productoSeleccionado={productoSeleccionado}
        />

        {productoSeleccionado && (
          <>
            <div className="mt-6 p-4 bg-zinc-700 rounded-lg shadow-md flex flex-col items-center">
              <h2 className="text-xl font-bold mb-3">
                {productoSeleccionado.nombre}
              </h2>
              {productoSeleccionado.imagen_data ? (
                <img
                  src={productoSeleccionado.imagen_data}
                  alt={productoSeleccionado.nombre}
                  className="w-full max-w-xs h-48 object-cover rounded-lg mb-3 border border-zinc-600"
                />
              ) : (
                <div className="w-full max-w-xs h-48 bg-zinc-600 flex items-center justify-center rounded-lg mb-3">
                  <span className="text-gray-400 text-sm">Sin imagen</span>
                </div>
              )}
              {productoSeleccionado.descripcion && (
                <p className="text-gray-300 text-center text-sm mb-2">
                  {productoSeleccionado.descripcion}
                </p>
              )}
            </div>

            <SucursalList
              sucursales={sucursalesDelProducto}
              onSelectSucursal={handleSelectSucursal}
              sucursalSeleccionada={sucursalSeleccionada}
            />

            {sucursalSeleccionada && (
              <>
                <CantidadSelector
                  cantidad={cantidad}
                  onCantidadChange={setCantidad}
                  maxStock={sucursalSeleccionada.stock}
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={calcularTotal}
                    className="bg-blue-600 hover:bg-blue-500 transition-colors text-white px-4 py-2 rounded-lg flex-1 font-semibold"
                  >
                    Calcular Total
                  </button>
                  <button
                    onClick={realizarCompra}
                    className="bg-orange-600 hover:bg-orange-500 transition-colors text-white px-4 py-2 rounded-lg flex-1 font-semibold"
                  >
                    Comprar
                  </button>
                </div>
                <TotalDisplay total={total} />{" "}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
