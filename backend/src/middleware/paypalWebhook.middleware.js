const { verifyPayPalWebhook } = require("../providers/paypal/paypal.webhook");
const logger = require("../utils/logger");

async function paypalWebhookMiddleware(req, res, next) {
    try {
        console.log("[PayPal Webhook] 2. Signature middleware started");
        console.log("[PayPal Webhook] PayPal signature header presence:", {
            authAlgo: Boolean(req.header("paypal-auth-algo")),
            certUrl: Boolean(req.header("paypal-cert-url")),
            transmissionId: Boolean(req.header("paypal-transmission-id")),
            transmissionSig: Boolean(req.header("paypal-transmission-sig")),
            transmissionTime: Boolean(req.header("paypal-transmission-time"))
        });

        console.log("[PayPal Webhook] 3. Verifying PayPal webhook signature...");
        const isVerified = await verifyPayPalWebhook(req);
        console.log("[PayPal Webhook] 4. Signature verification result:", isVerified);

        if(!isVerified){
            console.log("[PayPal Webhook] Signature rejected. Stopping request before controller.");
            logger.warn("Invalid PayPal webhook signature", {
                eventId: req.body?.id,
                eventType: req.body?.event_type
            });

            return res.status(401).json({
                success: false,
                message: "Invalid PayPal webhook signature"
            });
        }

        console.log("[PayPal Webhook] Signature accepted. Moving to controller.");
        next();
    } catch (err) {
        console.log("[PayPal Webhook] Signature middleware error:", err.message);
        logger.error("PayPal webhook signature verification failed", {
            eventId: req.body?.id,
            eventType: req.body?.event_type,
            error: err.message
        });

        next(err);
    }
}

module.exports = {
    paypalWebhookMiddleware
};
