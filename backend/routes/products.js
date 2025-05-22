const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM productos");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener productos", error.stack);
    res.status(500).send("Error en el servidor");
  }
});

router.get("/:productoId/sucursales", async (req, res) => {
  const { productoId } = req.params;

  try {
    const query = `
        SELECT 
          ss.stock, 
          ss.precio, 
          s.nombre AS sucursal,
          s.id AS sucursal_id
        FROM stock_sucursales ss
        JOIN sucursales s ON ss.sucursal_id = s.id
        WHERE ss.producto_id = $1;
      `;

    const result = await pool.query(query, [productoId]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ mensaje: "Producto no disponible en ninguna sucursal" });
    }

    const enviarEventoStockBajo = req.app.get("enviarEventoStockBajo");
    if (enviarEventoStockBajo) {
      result.rows.forEach((sucursal) => {
        if (sucursal.stock === 0) {
          enviarEventoStockBajo(`Stock bajo en ${sucursal.sucursal}`);
        }
      });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener sucursales del producto:", error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

module.exports = router;
