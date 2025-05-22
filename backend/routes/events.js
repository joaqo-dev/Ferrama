const express = require("express");
const router = express.Router();

let clients = [];

router.get("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);
  res.write(`data: Conectado correctamente\n\n`);

  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
    res.end();
  });
});

function enviarAlertaStockBajo(mensaje) {
  clients.forEach((res) => {
    res.write(`data: ${mensaje}\n\n`);
  });
}

module.exports = { router, enviarAlertaStockBajo };
