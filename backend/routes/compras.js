const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const axios = require("axios");
const { enviarAlertaStockBajo } = require("./events");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

//  Ruta 1: Calcular total sin modificar el stock
router.post("/calcular", async (req, res) => {
  const { producto_id, sucursal_id, cantidad } = req.body;

  try {
    const stockResult = await pool.query(
      `
      SELECT stock, precio
      FROM stock_sucursales
      WHERE producto_id = $1 AND sucursal_id = $2
    `,
      [producto_id, sucursal_id]
    );

    if (stockResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Producto no encontrado en esa sucursal" });
    }

    const { stock, precio } = stockResult.rows[0];

    if (stock < cantidad) {
      return res.status(400).json({ error: "Stock insuficiente" });
    }

    const totalCLP = precio * cantidad;

    const response = await axios.get(
      "https://api.exchangerate-api.com/v4/latest/CLP"
    );
    const rate = response.data.rates.USD;
    const totalUSD = (totalCLP * rate).toFixed(2);

    res.json({
      total_clp: totalCLP,
      total_usd: totalUSD,
      mensaje: "Cálculo realizado correctamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al calcular el total" });
  }
});

// Ruta 2: Confirmar compra (descuenta el stock)
router.post("/", async (req, res) => {
  const { producto_id, sucursal_id, cantidad } = req.body;

  try {
    const stockResult = await pool.query(
      `
      SELECT stock
      FROM stock_sucursales
      WHERE producto_id = $1 AND sucursal_id = $2
    `,
      [producto_id, sucursal_id]
    );

    if (stockResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Producto no encontrado en esa sucursal" });
    }

    const { stock } = stockResult.rows[0];

    if (stock < cantidad) {
      return res.status(400).json({ error: "Stock insuficiente" });
    }

    await pool.query(
      `
      UPDATE stock_sucursales
      SET stock = stock - $1
      WHERE producto_id = $2 AND sucursal_id = $3
    `,
      [cantidad, producto_id, sucursal_id]
    );

    // Verificar si el stock ha llegado a 0
    const stockFinalRes = await pool.query(
      `
      SELECT i.stock, p.nombre AS producto, s.nombre AS sucursal
      FROM stock_sucursales i
      JOIN productos p ON i.producto_id = p.id
      JOIN sucursales s ON i.sucursal_id = s.id
      WHERE i.producto_id = $1 AND i.sucursal_id = $2
    `,
      [producto_id, sucursal_id]
    );

    const { stock: stockFinal, producto, sucursal } = stockFinalRes.rows[0];

    if (stockFinal === 0) {
      const mensaje = `⚠️ Stock bajo de ${producto} en ${sucursal}`;
      enviarAlertaStockBajo(mensaje);
    }

    res.json({ mensaje: "Compra realizada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al procesar la compra" });
  }
});

module.exports = router;
