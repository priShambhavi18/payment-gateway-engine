const axios = require("axios");
const { getPayPalAccessToken } = require("./paypal.provider");

function getRequiredHeader(req, headerName) {
    const value = req.header(headerName);

    if(!value){
        throw new Error(`${headerName} header is required`);
    }

    return value;
}

async function verifyPayPalWebhook(req) {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    if(!webhookId){
        throw new Error("PAYPAL_WEBHOOK_ID is not configured");
    }

    console.log("[PayPal Webhook] 3a. PAYPAL_WEBHOOK_ID configured:", Boolean(webhookId));
    console.log("[PayPal Webhook] 3b. Requesting PayPal access token for webhook verification");
    const accessToken = await getPayPalAccessToken();

    console.log("[PayPal Webhook] 3c. Calling PayPal verify-webhook-signature endpoint");
    const response = await axios({
        method: "post",
        url: `${process.env.PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
        },
        data: {
            auth_algo: getRequiredHeader(req, "paypal-auth-algo"),
            cert_url: getRequiredHeader(req, "paypal-cert-url"),
            transmission_id: getRequiredHeader(req, "paypal-transmission-id"),
            transmission_sig: getRequiredHeader(req, "paypal-transmission-sig"),
            transmission_time: getRequiredHeader(req, "paypal-transmission-time"),
            webhook_id: webhookId,
            webhook_event: req.body
        }
    });

    console.log("[PayPal Webhook] 3d. PayPal verification API response:", {
        status: response.status,
        verificationStatus: response.data?.verification_status
    });

    return response.data.verification_status === "SUCCESS";
}

module.exports = {
    verifyPayPalWebhook
};
