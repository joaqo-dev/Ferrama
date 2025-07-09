const express = require("express");
const router = express.Router();
const productGrpcClient = require("../grpc_clients/productGrpcClient");
const grpc = require("@grpc/grpc-js");

router.post("/create", async (req, res) => {
  const { nombre, descripcion, stock_inicial, precio_inicial, imagen_data } =
    req.body;

  if (!nombre || stock_inicial === undefined || precio_inicial === undefined) {
    return res.status(400).json({
      error:
        "Faltan campos obligatorios (nombre, stock inicial, precio inicial).",
    });
  }
  if (stock_inicial < 0 || precio_inicial <= 0) {
    return res.status(400).json({
      error:
        "El stock inicial no puede ser negativo y el precio inicial debe ser mayor a cero.",
    });
  }

  try {
    const response = await productGrpcClient.createProduct({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || "",
      stock_inicial: parseInt(stock_inicial),
      precio_inicial: parseFloat(precio_inicial),
      imagen_data: imagen_data || "",
    });

    if (!response.success) {
      let statusCode = 400;
      if (response.error_code === "DUPLICATE_ENTRY") {
        statusCode = 409;
      } else if (response.error_code === "INTERNAL_ERROR") {
        statusCode = 500;
      }
      return res.status(statusCode).json({ error: response.message });
    }

    res.status(201).json({
      message: response.message,
      producto: {
        id: response.product.id,
        nombre: response.product.nombre,
        descripcion: response.product.descripcion,
        imagen_data: response.product.imagen_data || "",
      },
    });
  } catch (error) {
    console.error(
      "Error al llamar al servicio gRPC para crear producto:",
      error
    );

    let statusCode = 500;
    let errorMessage = "Error interno del servidor al crear el producto.";

    if (error.code) {
      switch (error.code) {
        case grpc.status.INVALID_ARGUMENT:
          statusCode = 400;
          errorMessage =
            error.details || "Argumentos inválidos proporcionados.";
          break;
        case grpc.status.ALREADY_EXISTS:
          statusCode = 409;
          errorMessage =
            error.details ||
            "Ya existe un producto con este nombre o una configuración de stock duplicada.";
          break;
        case grpc.status.UNAVAILABLE:
          statusCode = 503;
          errorMessage =
            "El servicio gRPC no está disponible. Por favor, inténtalo más tarde.";
          break;
        case grpc.status.FAILED_PRECONDITION:
          statusCode = 412;
          errorMessage =
            error.details ||
            "Condición previa fallida (ej. no hay sucursales).";
          break;
        case grpc.status.INTERNAL:
        default:
          errorMessage = error.details || "Error interno del servicio gRPC.";
          break;
      }
    }
    res
      .status(statusCode)
      .json({ error: errorMessage, details: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const response = await productGrpcClient.getProducts({});

    if (response.error_message) {
      return res.status(500).json({ error: response.error_message });
    }

    //  Mapear los productos
    const productsWithImages = response.products.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      imagen_data: p.imagen_data || "",
    }));

    res.json(productsWithImages); // Enviar la lista de productos con imágenes
  } catch (error) {
    console.error(
      "Error al llamar al servicio gRPC para obtener productos:",
      error
    );

    let statusCode = 500;
    let errorMessage = "Error interno del servidor al obtener productos.";

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
            "Error interno del servicio gRPC al obtener productos.";
          break;
      }
    }
    res
      .status(statusCode)
      .json({ error: errorMessage, details: error.message });
  }
});

router.get("/:productId/sucursales", async (req, res) => {
  const productId = parseInt(req.params.productId);
  if (isNaN(productId)) {
    return res.status(400).json({ error: "ID de producto inválido." });
  }

  try {
    const sucursalesResponse = await productGrpcClient.getSucursales({});
    if (sucursalesResponse.error_message) {
      return res.status(500).json({ error: sucursalesResponse.error_message });
    }

    const sucursalesConStock = [];

    for (const sucursal of sucursalesResponse.sucursales) {
      try {
        const stockResponse = await productGrpcClient.getStock({
          product_id: productId,
          sucursal_id: sucursal.id,
        });

        if (stockResponse.success) {
          sucursalesConStock.push({
            id: sucursal.id,
            nombre: sucursal.nombre,
            ubicacion: sucursal.ubicacion,
            stock: stockResponse.stock,
            precio: stockResponse.precio,
          });
        }
      } catch (stockError) {
        if (stockError.code !== grpc.status.NOT_FOUND) {
          console.warn(
            `Advertencia: Error al obtener stock para producto ${productId} en sucursal ${sucursal.id}:`,
            stockError.details || stockError.message
          );
        }
      }
    }

    res.json(sucursalesConStock);
  } catch (error) {
    console.error(
      "Error al llamar al servicio gRPC para obtener sucursales con stock:",
      error
    );
    let statusCode = 500;
    let errorMessage =
      "Error interno del servidor al buscar sucursales para el producto.";

    if (error.code) {
      switch (error.code) {
        case grpc.status.UNAVAILABLE:
          statusCode = 503;
          errorMessage =
            "El servicio gRPC no está disponible. Por favor, inténtalo más tarde.";
          break;
        case grpc.status.INTERNAL:
        default:
          errorMessage = error.details || errorMessage;
          break;
      }
    }
    res
      .status(statusCode)
      .json({ error: errorMessage, details: error.message });
  }
});

module.exports = router;
