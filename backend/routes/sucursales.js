const express = require("express");
const router = express.Router();
const productGrpcClient = require("../grpc_clients/productGrpcClient");

router.get("/", async (req, res) => {
  try {
    const response = await productGrpcClient.getSucursales({});

    if (response.error_message) {
      return res.status(500).json({ error: response.error_message });
    }

    res.json(response.sucursales);
  } catch (error) {
    console.error(
      "Error al llamar al servicio gRPC para obtener sucursales:",
      error
    );

    let statusCode = 500;
    let errorMessage = "Error interno del servidor al obtener sucursales.";

    if (error.code) {
      switch (error.code) {
        case grpc.status.UNAVAILABLE:
          statusCode = 503;
          errorMessage =
            "El servicio gRPC no está disponible. Por favor, inténtalo más tarde.";
          break;
        case grpc.status.INTERNAL:
        default:
          errorMessage =
            error.details ||
            "Error interno del servicio gRPC al obtener sucursales.";
          break;
      }
    }
    res
      .status(statusCode)
      .json({ error: errorMessage, details: error.message });
  }
});

module.exports = router;
