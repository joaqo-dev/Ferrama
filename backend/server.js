require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const { Pool } = require("pg");

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

(async () => {
  let client;
  try {
    console.log("Iniciando prueba de conexión a la base de datos...");
    console.log(`Intentando conectar con:
      DB_HOST: ${process.env.DB_HOST}
      DB_PORT: ${process.env.DB_PORT}
      DB_USER: ${process.env.DB_USER}
      DB_NAME: ${process.env.DB_NAME}
    `);
    client = await pool.connect();
    console.log(" Conectado a la base de datos con éxito.");
    // Intenta una consulta simple a la tabla, especificando public.
    const res = await client.query(
      "SELECT 1 FROM public.transacciones_webpay LIMIT 1"
    );
    console.log(
      " Consulta a public.transacciones_webpay exitosa al inicio del servidor. La tabla es visible."
    );
    client.release(); // Libera el cliente
  } catch (err) {
    console.error(
      " ERROR EN LA CONEXIÓN O CONSULTA INICIAL A transacciones_webpay:"
    );
    console.error(`Mensaje de error: ${err.message}`);
    console.error("Por favor, verifica:");
    console.error(
      "  - El archivo .env: que las credenciales (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) sean CORRECTAS."
    );
    console.error(
      '  - Si la tabla "transacciones_webpay" realmente existe en la base de datos y esquema "public" (usa \\dt en psql).'
    );
    if (client) {
      client.release();
    }
  }
})();

app.use(cors());
app.use(express.json());

const productosRoutes = require("./routes/products");
const comprasRoutes = require("./routes/compras");
const webpayRoutes = require("./routes/webpay");
const eventsModule = require("./routes/events");
const eventsRoutes = eventsModule.router;

app.use("/api/productos", productosRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/webpay", webpayRoutes);
app.use("/events", eventsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
