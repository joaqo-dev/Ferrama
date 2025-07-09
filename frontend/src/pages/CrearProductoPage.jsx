// frontend/src/pages/CrearProductoPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function CrearProductoPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [stockInicial, setStockInicial] = useState(0);
  const [precioInicial, setPrecioInicial] = useState(100);
  const [imagenData, setImagenData] = useState("");
  const [imagenPreview, setImagenPreview] = useState("");
  const [error, setError] = useState("");

  //Función para manejar la selección de la imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        toast.error(
          "Por favor, selecciona un archivo de imagen válido (ej. JPG, PNG)."
        );
        e.target.value = null;
        setImagenData("");
        setImagenPreview("");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error("La imagen es demasiado grande. Máximo 2MB.");
        e.target.value = null;
        setImagenData("");
        setImagenPreview("");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenData(reader.result);
        setImagenPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagenData("");
      setImagenPreview("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    if (!nombre.trim() || stockInicial < 0 || precioInicial <= 0) {
      setError(
        "Por favor, completa el nombre, y asegúrate de que el stock no sea negativo y el precio sea mayor a cero."
      );
      toast.error("Campos incompletos o inválidos.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/productos/create",
        {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          stock_inicial: parseInt(stockInicial),
          precio_inicial: parseFloat(precioInicial),
          imagen_data: imagenData || null,
        }
      );

      toast.success(
        response.data.message ||
          "Producto creado exitosamente para todas las sucursales!"
      );
      navigate("/");
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        "Error al crear el producto. Inténtalo de nuevo.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error al crear producto:", err.response?.data || err);
    }
  };

  const ErrorAlerta = ({ mensaje }) =>
    mensaje ? (
      <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-center">
        {mensaje}
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl space-y-6 p-6 bg-zinc-800 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-semibold text-center">
          Crear Nuevo Producto 🛠️
        </h1>

        <ErrorAlerta mensaje={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="nombre"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Nombre del Producto:
            </label>
            <input
              type="text"
              id="nombre"
              className="bg-zinc-700 border border-zinc-600 text-white p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="descripcion"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Descripción (opcional):
            </label>
            <textarea
              id="descripcion"
              rows="3"
              className="bg-zinc-700 border border-zinc-600 text-white p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            ></textarea>
          </div>

          <div>
            <label
              htmlFor="stock"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Stock Inicial (para todas las sucursales):
            </label>
            <input
              type="number"
              id="stock"
              className="bg-zinc-700 border border-zinc-600 text-white p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={stockInicial}
              onChange={(e) =>
                setStockInicial(Math.max(0, parseInt(e.target.value || "0")))
              }
              min="0"
              required
            />
          </div>

          <div>
            <label
              htmlFor="precio"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Precio Inicial (CLP para todas las sucursales):
            </label>
            <input
              type="number"
              id="precio"
              className="bg-zinc-700 border border-zinc-600 text-white p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={precioInicial}
              onChange={(e) =>
                setPrecioInicial(
                  Math.max(1, parseFloat(e.target.value || "100"))
                )
              }
              min="1"
              step="0.01"
              required
            />
          </div>

          <div>
            <label
              htmlFor="imagen"
              className="block text-sm font-medium text-gray-300"
            >
              Imagen del Producto
            </label>
            <input
              type="file"
              id="imagen"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full text-sm text-gray-400
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100"
            />

            {imagenPreview && (
              <div className="mt-2">
                <p className="text-gray-400 text-sm mb-1">Vista previa:</p>
                <img
                  src={imagenPreview}
                  alt="Vista previa de la imagen"
                  className="max-w-xs h-auto rounded-md shadow-lg"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 transition-colors text-white px-4 py-2 rounded-lg w-full font-semibold"
          >
            Crear Producto
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-2 bg-gray-600 hover:bg-gray-500 transition-colors text-white px-4 py-2 rounded-lg w-full font-semibold"
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}

export default CrearProductoPage;
