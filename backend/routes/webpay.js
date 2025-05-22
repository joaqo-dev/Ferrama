const express = require("express");
const router = express.Router();
const pkg = require("transbank-sdk");
const { Pool } = require("pg");
const { enviarAlertaStockBajo } = require("./events");

const {
  WebpayPlus,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
  Environment,
} = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const webpay = new WebpayPlus.Transaction({
  commerceCode: IntegrationCommerceCodes.WEBPAY_PLUS,
  apiKey: IntegrationApiKeys.WEBPAY,
  environment: Environment.Integration,
});

const processingTokens = new Set();

router.post("/crear", async (req, res) => {
  const {
    buyOrder,
    sessionId,
    amount,
    producto_id,
    sucursal_id,
    cantidad_comprada,
  } = req.body;
  console.log("Datos recibidos para crear transacción:", {
    buyOrder,
    sessionId,
    amount,
    producto_id,
    sucursal_id,
    cantidad_comprada,
  });
  console.log(
    "Intentando insertar en transacciones_webpay (con public. prefix)..."
  );

  try {
    const returnUrl = "http://localhost:5173/pago-finalizado";

    const response = await webpay.create(
      buyOrder,
      sessionId,
      amount,
      returnUrl
    );

    await pool.query(
      `INSERT INTO public.transacciones_webpay (buy_order, session_id, amount, token, producto_id, sucursal_id, cantidad_comprada, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'iniciada')
       ON CONFLICT (buy_order) DO UPDATE SET token = EXCLUDED.token, session_id = EXCLUDED.session_id, amount = EXCLUDED.amount, producto_id = EXCLUDED.producto_id, sucursal_id = EXCLUDED.sucursal_id, cantidad_comprada = EXCLUDED.cantidad_comprada, estado = 'iniciada'`,
      [
        buyOrder,
        sessionId,
        amount,
        response.token,
        producto_id,
        sucursal_id,
        cantidad_comprada,
      ]
    );

    console.log("Inserción en public.transacciones_webpay exitosa.");

    res.json({
      token: response.token,
      url: response.url,
    });
  } catch (err) {
    console.error("Error al crear la transacción:", err.message);
    res
      .status(500)
      .json({ error: "Error al crear la transacción", details: err.message });
  }
});

router.post("/confirmar", async (req, res) => {
  const { token_ws } = req.body;
  console.log("Token recibido en /confirmar (POST):", token_ws);

  if (!token_ws) {
    return res
      .status(400)
      .json({ error: "Token de confirmación no recibido." });
  }

  if (processingTokens.has(token_ws)) {
    console.warn(
      `Token ${token_ws} ya está en procesamiento. Ignorando doble llamada concurrente.`
    );
    return res.status(409).json({
      error: "La transacción ya está siendo procesada.",
      details:
        "Se ha recibido una doble solicitud de confirmación para el mismo token.",
    });
  }

  processingTokens.add(token_ws);

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const existingTransactionRes = await client.query(
      `SELECT estado, buy_order, amount, producto_id, sucursal_id, cantidad_comprada
       FROM public.transacciones_webpay
       WHERE token = $1 FOR UPDATE`,
      [token_ws]
    );

    let transaccionData;
    if (existingTransactionRes.rows.length === 0) {
      await client.query("ROLLBACK");
      console.error(
        "Transacción no encontrada en la base de datos para el token:",
        token_ws
      );
      return res.status(404).json({
        error: "No se encontró información de la compra para el token.",
      });
    }

    transaccionData = existingTransactionRes.rows[0];
    const { estado } = transaccionData;

    if (estado === "confirmada_exitosa" || estado === "confirmada_rechazada") {
      console.log(
        `Transacción con token ${token_ws} ya fue confirmada con estado: ${estado}.`
      );
      await client.query("COMMIT");

      if (estado === "confirmada_exitosa") {
        return res.json({
          mensaje: "Compra ya estaba confirmada con éxito.",
          total_clp: transaccionData.amount,
          buy_order: transaccionData.buy_order,
          transbank_status: 0,
          already_processed: true,
        });
      } else {
        return res.status(400).json({
          error: "El pago ya fue rechazado por Transbank.",
          transbank_status: -1,
          already_processed: true,
        });
      }
    }

    const result = await webpay.commit(token_ws);
    console.log("Resultado de commit de Transbank:", result);

    if (result.response_code === 0) {
      const { producto_id, sucursal_id, cantidad_comprada } = transaccionData;

      const stockResult = await client.query(
        `SELECT stock FROM public.stock_sucursales WHERE producto_id = $1 AND sucursal_id = $2 FOR UPDATE`,
        [producto_id, sucursal_id]
      );

      if (stockResult.rows.length === 0) {
        console.error(
          "Producto no encontrado en sucursal para descuento de stock después de pago."
        );
        await client.query("ROLLBACK");
        return res.status(500).json({
          error: "Error interno: producto no disponible para descuento.",
        });
      }

      const { stock } = stockResult.rows[0];

      if (stock < cantidad_comprada) {
        console.error(
          "Stock insuficiente después de pago exitoso. Reembolso necesario."
        );
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Stock insuficiente a pesar del pago." });
      }

      await client.query(
        `UPDATE public.stock_sucursales SET stock = stock - $1 WHERE producto_id = $2 AND sucursal_id = $3`,
        [cantidad_comprada, producto_id, sucursal_id]
      );

      const stockFinalRes = await client.query(
        `SELECT i.stock, p.nombre AS producto, s.nombre AS sucursal
         FROM public.stock_sucursales i
         JOIN public.productos p ON i.producto_id = p.id
         JOIN public.sucursales s ON i.sucursal_id = s.id
         WHERE i.producto_id = $1 AND i.sucursal_id = $2`,
        [producto_id, sucursal_id]
      );

      const { stock: stockFinal, producto, sucursal } = stockFinalRes.rows[0];

      if (stockFinal === 0) {
        const mensaje = ` Stock bajo de ${producto} en ${sucursal}`;
        enviarAlertaStockBajo(mensaje);
      }

      await client.query(
        `UPDATE public.transacciones_webpay SET estado = 'confirmada_exitosa' WHERE token = $1`,
        [token_ws]
      );

      await client.query("COMMIT");

      res.json({
        mensaje: "Compra realizada con éxito y stock actualizado.",
        total_clp: result.amount,
        buy_order: result.buy_order,
        transbank_status: result.response_code,
      });
    } else {
      console.log(
        "Transacción de Transbank rechazada:",
        result.response_code,
        result.response_code === -1 ? "(Abortada por cliente)" : ""
      );
      await client.query(
        `UPDATE public.transacciones_webpay SET estado = 'confirmada_rechazada' WHERE token = $1`,
        [token_ws]
      );
      await client.query("COMMIT");
      res.status(400).json({
        error: "El pago fue rechazado por Transbank.",
        transbank_status: result.response_code,
        details:
          result.response_code === -1
            ? "Transacción abortada por el cliente."
            : "Pago rechazado por el banco.",
      });
    }
  } catch (err) {
    console.error(
      "Error al confirmar la transacción o descontar stock:",
      err.message
    );
    if (client) {
      await client.query("ROLLBACK");
    }

    if (
      err.message.includes("Request failed with status code 422") &&
      err.message.includes("Transaction already locked by another process")
    ) {
      console.warn(
        "Doble intento de commit para el mismo token. Esto es normal si la confirmación ya se procesó."
      );
      try {
        const finalStateCheck = await pool.query(
          `SELECT estado, buy_order, amount FROM public.transacciones_webpay WHERE token = $1`,
          [token_ws]
        );
        if (finalStateCheck.rows.length > 0) {
          const { estado, buy_order, amount } = finalStateCheck.rows[0];
          if (estado === "confirmada_exitosa") {
            return res.json({
              mensaje:
                "La compra ya fue confirmada con éxito (segunda llamada ignorada).",
              total_clp: amount,
              buy_order: buy_order,
              transbank_status: 0,
              already_processed: true,
            });
          } else if (estado === "confirmada_rechazada") {
            return res.status(400).json({
              error: "La compra ya fue rechazada (segunda llamada ignorada).",
              transbank_status: -1,
              already_processed: true,
            });
          }
        }
      } catch (dbErr) {
        console.error(
          "Error al re-consultar estado de transacción después de error 422:",
          dbErr.message
        );
      }
      res.status(409).json({
        error:
          "La transacción ya ha sido procesada o está siendo procesada por Transbank.",
        details:
          "Se ha recibido una doble solicitud de confirmación. Verifique el estado en su sistema.",
      });
    } else {
      res.status(500).json({
        error: "Error interno al procesar la confirmación del pago.",
        details: err.message,
      });
    }
  } finally {
    processingTokens.delete(token_ws);
    if (client) {
      client.release();
    }
  }
});

module.exports = router;
