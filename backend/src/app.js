const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const merchantRoutes = require("./routes/merchant.routes");
const paymentRoutes = require("./routes/payment.routes");
const webhookRoutes = require("./webhooks/webhook.routes");
const settlementRoutes =require("./routes/settlement.routes"
    );

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString("utf8");
  }
}));
app.use(morgan("dev"));

app.use("/merchants", merchantRoutes);
app.use("/payments", paymentRoutes);
app.use("/webhook", webhookRoutes);
app.use("/settlements", settlementRoutes);

app.get("/payment-success", async (req, res) => {
  const { token } = req.query;
  res.send(`Payment successful! Token: ${token}`);
});
app.get("/payment-cancel", (req, res) => {
  res.send("Payment cancelled.");
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

module.exports = app;
