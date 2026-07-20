const express = require("express");
const router = express.Router();

const webhookController = require("./webhook.controller");
const { paypalWebhookMiddleware } = require("../middleware/paypalWebhook.middleware");

router.post("/paypal", (req, res, next) => {
    console.log("[PayPal Webhook] 1. Route hit: POST /webhook/paypal");
    console.log("[PayPal Webhook] Request summary:", {
        method: req.method,
        path: req.originalUrl,
        contentType: req.headers["content-type"],
        eventId: req.body?.id,
        eventType: req.body?.event_type
    });
    next();
}, paypalWebhookMiddleware, webhookController.handlePayPalWebhook); 

module.exports = router;
