const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { Pool } = require("pg");
require("dotenv").config();

// Ruta al archivo .proto
const PROTO_PATH = __dirname + "/../protos/product.proto";

// Configuración
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Cargar gRPC
const productProto = grpc.loadPackageDefinition(packageDefinition).product;

// base de datos
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const productServiceImpl = {
  CreateProduct: async (call, callback) => {
    const { nombre, descripcion, stock_inicial, precio_inicial } = call.request;

    if (
      !nombre ||
      stock_inicial === undefined ||
      precio_inicial === undefined
    ) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message:
          "Faltan campos obligatorios (nombre, stock inicial, precio inicial).",
      });
    }
    if (stock_inicial < 0 || precio_inicial <= 0) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message:
          "El stock inicial no puede ser negativo y el precio inicial debe ser mayor a cero.",
      });
    }

    let client;
    try {
      client = await pool.connect();
      await client.query("BEGIN");

      // Insertar el nuevo producto
      const productInsertResult = await client.query(
        `INSERT INTO public.productos (nombre, descripcion) VALUES ($1, $2) RETURNING id`,
        [nombre, descripcion || null]
      );
      const newProductId = productInsertResult.rows[0].id;

      // Obtener  las sucursales
      const sucursalesResult = await client.query(
        "SELECT id FROM public.sucursales"
      );
      const sucursalesIds = sucursalesResult.rows.map((row) => row.id);

      if (sucursalesIds.length === 0) {
        await client.query("ROLLBACK");
        return callback({
          code: grpc.status.FAILED_PRECONDITION,
          message: "No hay sucursales registradas para asignar el producto.",
        });
      }

      //   insertar stock para cada sucursal
      const stockValues = sucursalesIds
        .map(
          (sucursalId) =>
            `(${newProductId}, ${sucursalId}, ${stock_inicial}, ${precio_inicial})`
        )
        .join(",");
      await client.query(
        `INSERT INTO public.stock_sucursales (producto_id, sucursal_id, stock, precio) VALUES ${stockValues}`
      );

      await client.query("COMMIT");

      callback(null, {
        success: true,
        message:
          "Producto creado exitosamente y stock inicial registrado para todas las sucursales.",
        product: { id: newProductId, nombre, descripcion: descripcion || "" },
        error_code: null,
      });
    } catch (error) {
      if (client) {
        await client.query("ROLLBACK");
      }
      console.error("Error gRPC al crear el producto:", error);
      if (error.code === "23505") {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message:
            "Ya existe un producto con este nombre o una configuración de stock duplicada para este producto en alguna sucursal.",
          error_code: "DUPLICATE_ENTRY",
        });
      }
      callback({
        code: grpc.status.INTERNAL,
        message: "Error interno del servidor al crear el producto.",
        details: error.message,
        error_code: "INTERNAL_ERROR",
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  },

  // obtener todas las sucursales
  GetSucursales: async (call, callback) => {
    try {
      const result = await pool.query(
        "SELECT id, nombre, ubicacion FROM public.sucursales ORDER BY nombre ASC"
      );
      const sucursales = result.rows.map((row) => ({
        id: row.id,
        nombre: row.nombre,
        ubicacion: row.ubicacion || "",
      }));
      callback(null, { sucursales: sucursales, error_message: null });
    } catch (error) {
      console.error("Error gRPC al obtener sucursales:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: "Error interno del servidor al obtener sucursales.",
        details: error.message,
      });
    }
  },

  // obtener todos los productos
  GetProducts: async (call, callback) => {
    try {
      const result = await pool.query(
        "SELECT id, nombre, descripcion FROM public.productos ORDER BY nombre ASC"
      );
      const products = result.rows.map((row) => ({
        id: row.id,
        nombre: row.nombre,
        descripcion: row.descripcion || "",
      }));
      callback(null, { products: products, error_message: null });
    } catch (error) {
      console.error("Error gRPC al obtener productos:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: "Error interno del servidor al obtener productos.",
        details: error.message,
      });
    }
  },

  GetProduct: (call, callback) => {
    callback({
      code: grpc.status.UNIMPLEMENTED,
      message: "Método GetProduct no implementado.",
    });
  },
  GetStock: (call, callback) => {
    callback({
      code: grpc.status.UNIMPLEMENTED,
      message: "Método GetStock no implementado.",
    });
  },
  UpdateStock: (call, callback) => {
    callback({
      code: grpc.status.UNIMPLEMENTED,
      message: "Método UpdateStock no implementado.",
    });
  },

  GetStock: async (call, callback) => {
    const { product_id, sucursal_id } = call.request;

    if (!product_id || !sucursal_id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Se requieren product_id y sucursal_id para obtener el stock.",
      });
    }

    try {
      const result = await pool.query(
        `SELECT stock, precio FROM public.stock_sucursales
                 WHERE producto_id = $1 AND sucursal_id = $2`,
        [product_id, sucursal_id]
      );

      if (result.rows.length === 0) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message:
            "Stock no encontrado para este producto en la sucursal especificada.",
          product_id: product_id,
          sucursal_id: sucursal_id,
        });
      }

      const stockInfo = result.rows[0];
      callback(null, {
        success: true,
        product_id: product_id,
        sucursal_id: sucursal_id,
        stock: stockInfo.stock,

        precio: parseFloat(stockInfo.precio),
        message: "Stock obtenido exitosamente.",
      });
    } catch (error) {
      console.error("Error gRPC al obtener stock:", error);
      callback({
        code: grpc.status.INTERNAL,
        message: "Error interno del servidor al obtener stock.",
        details: error.message,
      });
    }
  },

  GetProduct: (call, callback) => {
    callback({
      code: grpc.status.UNIMPLEMENTED,
      message: "Método GetProduct no implementado.",
    });
  },

  UpdateStock: (call, callback) => {
    callback({
      code: grpc.status.UNIMPLEMENTED,
      message: "Método UpdateStock no implementado.",
    });
  },
};

// arrancar el servidor gRPC
function main() {
  const server = new grpc.Server();
  server.addService(productProto.ProductService.service, productServiceImpl);
  const grpcPort = process.env.GRPC_PORT || 50051;

  server.bindAsync(
    `0.0.0.0:${grpcPort}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error("Error al iniciar el servidor gRPC:", err);
        return;
      }
      console.log(`Servidor gRPC escuchando en el puerto ${port}`);
      server.start();
    }
  );
}

main();
