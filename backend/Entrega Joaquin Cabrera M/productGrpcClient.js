const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
require("dotenv").config();

// archivo .proto
const PROTO_PATH = __dirname + "/../protos/product.proto";

// Configuración
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const productProto = grpc.loadPackageDefinition(packageDefinition).product;

// servidor gRPC
const GRPC_SERVER_ADDRESS =
  process.env.GRPC_SERVER_ADDRESS ||
  `localhost:${process.env.GRPC_PORT || 50051}`;

// Crear el cliente
const productGrpcClient = new productProto.ProductService(
  GRPC_SERVER_ADDRESS,
  grpc.credentials.createInsecure()
);

const promisifyGrpcCall = (client, methodName) => {
  return (params) => {
    return new Promise((resolve, reject) => {
      client[methodName](params, (error, response) => {
        if (error) {
          console.error(`Error en llamada gRPC a ${methodName}:`, error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  };
};

module.exports = {
  createProduct: promisifyGrpcCall(productGrpcClient, "CreateProduct"),
  getSucursales: promisifyGrpcCall(productGrpcClient, "GetSucursales"),
  getProducts: promisifyGrpcCall(productGrpcClient, "GetProducts"),
  getStock: promisifyGrpcCall(productGrpcClient, "GetStock"),
};
