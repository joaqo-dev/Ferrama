// src/pages/PagoFinalizado.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

function PagoFinalizado() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token_ws = queryParams.get("token_ws");
    const tbk_token = queryParams.get("TBK_TOKEN");

    const confirmPayment = async (token) => {
      try {
        const response = await axios.post(
          "http://localhost:3000/api/webpay/confirmar",
          { token_ws: token }
        );
        setPaymentStatus("success");
        setDetails(response.data);
        toast.success(response.data.mensaje || "Pago confirmado con éxito!");
      } catch (error) {
        console.error(
          "Error al confirmar el pago:",
          error.response?.data || error
        );

        if (
          error.response?.status === 409 &&
          error.response?.data?.already_processed
        ) {
          setPaymentStatus("success");
          setDetails(error.response.data);
          toast("La compra ya había sido procesada.", { icon: "ℹ️" });
        } else if (error.response?.status === 409) {
          setPaymentStatus("processing");
          setDetails(error.response.data);
          toast.loading(
            "La transacción está siendo procesada, por favor espere..."
          );
        } else {
          setPaymentStatus("rejected");
          setDetails(
            error.response?.data || {
              error: "Error desconocido al procesar el pago.",
            }
          );
          toast.error(
            error.response?.data?.error || "Error al confirmar el pago."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (token_ws) {
      confirmPayment(token_ws);
    } else if (tbk_token) {
      setPaymentStatus("rejected");
      setDetails({
        error: "Transacción abortada o fallida antes de la confirmación.",
      });
      setLoading(false);
      toast.error("Transacción abortada o fallida.");
    } else {
      setPaymentStatus("error");
      setDetails({ error: "No se encontró token de transacción." });
      setLoading(false);
      toast.error("No se encontró token de transacción.");
    }
  }, [location.search, navigate]);

  // Contenido y estilos
  let title = "";
  let icon = "";
  let textColor = "";
  let bgColor = "";
  let buttonColor = "bg-blue-600 hover:bg-blue-500";

  switch (paymentStatus) {
    case "success":
      title = "¡Pago Exitoso!";
      textColor = "text-emerald-400";
      bgColor = " bg-zinc-800";
      buttonColor = "bg-emerald-600 hover:bg-emerald-500";
      break;
    case "rejected":
      title = "Pago Rechazado";
      textColor = "text-red-400";
      bgColor = "bg-zinc-700";
      buttonColor = "bg-red-600 hover:bg-red-500";
      break;
    case "processing":
      title = "Procesando Pago...";
      textColor = "text-yellow-400";
      bgColor = "bg-zinc-700";
      buttonColor = "bg-yellow-600 hover:bg-yellow-500";
      break;
    case "error":
      title = "Error en el Pago";
      textColor = "text-gray-400";
      bgColor = "bg-zinc-700";
      buttonColor = "bg-gray-600 hover:bg-gray-500";
      break;
    default:
      title = "Cargando estado...";
      textColor = "text-gray-400";
      bgColor = "bg-zinc-700";
      break;
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center px-4">
      {loading ? (
        <div className="flex flex-col items-center justify-center p-8 bg-zinc-800 shadow-lg rounded-2xl max-w-sm w-full text-white">
          <svg
            className="animate-spin h-10 w-10 text-blue-500 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-xl font-semibold text-gray-200">
            Cargando estado del pago...
          </p>
          <p className="text-gray-400 text-sm mt-2">No cierres esta ventana.</p>
        </div>
      ) : (
        <div className={`p-8 shadow-lg max-w-md w-full rounded-2xl ${bgColor}`}>
          <h2
            className={`text-3xl font-extrabold mb-6 text-center ${textColor}`}
          >
            {icon} {title}
          </h2>

          <div className="space-y-4 text-gray-200 text-lg">
            {" "}
            {paymentStatus === "success" && (
              <>
                <p>
                  <span className="font-semibold text-gray-400">
                    Order de Compra:
                  </span>{" "}
                  {details?.buy_order}
                </p>
                <p>
                  <span className="font-semibold text-gray-400">
                    Monto Pagado:
                  </span>{" "}
                  ${details?.total_clp?.toLocaleString("es-CL")} CLP
                </p>
                <p className="mt-4 text-center text-gray-300">
                  {" "}
                  {}
                  {details?.mensaje}
                </p>
              </>
            )}
            {paymentStatus === "rejected" && (
              <>
                <p>
                  <span className="font-semibold text-gray-400">Error:</span>{" "}
                  {details?.error}
                </p>
                {details?.transbank_status && (
                  <p>
                    <span className="font-semibold text-gray-400">
                      Código Transbank:
                    </span>{" "}
                    {details.transbank_status}
                  </p>
                )}
                <p>
                  <span className="font-semibold text-gray-400">Detalles:</span>{" "}
                  {details?.details || "No hay detalles adicionales."}
                </p>
              </>
            )}
            {paymentStatus === "processing" && (
              <p className="text-center text-gray-300">
                {details?.details ||
                  "La transacción está siendo procesada, por favor espere."}
              </p>
            )}
            {paymentStatus === "error" && (
              <>
                <p>
                  <span className="font-semibold text-gray-400">Error:</span>{" "}
                  {details?.error}
                </p>
                <p>
                  <span className="font-semibold text-gray-400">Detalles:</span>{" "}
                  {details?.details || "No hay detalles adicionales."}
                </p>
              </>
            )}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => navigate("/")}
              className={`py-3 px-8 rounded-full text-white font-semibold text-lg transition duration-300 ease-in-out transform hover:scale-105 ${buttonColor}`}
            >
              Volver a Inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PagoFinalizado;
