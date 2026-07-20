const webhookService = require("./webhook.service");

async function handlePayPalWebhook(req, res, next) {
    try {
        console.log("[PayPal Webhook] 5. Controller received verified webhook:", {
            eventId: req.body?.id,
            eventType: req.body?.event_type,
            resourceType: req.body?.resource_type
        });

        const result = await webhookService.handlePayPalWebhook(req.body);

        console.log("[PayPal Webhook] 14. Controller sending 200 response:", result);
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error("[PayPal Webhook] Controller error:", err.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

module.exports = {
    handlePayPalWebhook
};
