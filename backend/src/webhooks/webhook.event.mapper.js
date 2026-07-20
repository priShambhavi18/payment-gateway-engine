const { PAYMENT_STATES } = require("../constants/payment.states");

const PAYPAL_EVENT_TO_PAYMENT_STATE = {
    "PAYMENT.CAPTURE.COMPLETED": PAYMENT_STATES.CAPTURED,
    "PAYMENT.CAPTURE.DENIED": PAYMENT_STATES.FAILED,
    "PAYMENT.CAPTURE.DECLINED": PAYMENT_STATES.FAILED,
    "PAYMENT.CAPTURE.REFUNDED": PAYMENT_STATES.REFUNDED,
    "CHECKOUT.ORDER.VOIDED": PAYMENT_STATES.CANCELLED,
    "CHECKOUT.ORDER.CANCELLED": PAYMENT_STATES.CANCELLED
};

function mapPayPalEventToPaymentState(eventType) {
    const paymentState = PAYPAL_EVENT_TO_PAYMENT_STATE[eventType] || null;
    console.log("[PayPal Webhook] Mapper mapPayPalEventToPaymentState:", {
        eventType,
        paymentState
    });
    return paymentState;
}

function getPayPalEventId(webhookEvent) {
    const eventId = webhookEvent.id || null;
    console.log("[PayPal Webhook] Mapper getPayPalEventId:", eventId);
    return eventId;
}

function getPayPalOrderId(webhookEvent) {
    const resource = webhookEvent.resource || {};

    const orderId = resource.supplementary_data?.related_ids?.order_id || resource.id || null;
    console.log("[PayPal Webhook] Mapper getPayPalOrderId:", orderId);
    return orderId;
}

function getPayPalCaptureId(webhookEvent) {
    const resource = webhookEvent.resource || {};

    if(webhookEvent.event_type === "PAYMENT.CAPTURE.REFUNDED"){
        const refundCaptureId = resource.supplementary_data?.related_ids?.capture_id || null;
        console.log("[PayPal Webhook] Mapper getPayPalCaptureId for refund:", refundCaptureId);
        return refundCaptureId;
    }

    if([
        "PAYMENT.CAPTURE.COMPLETED",
        "PAYMENT.CAPTURE.DENIED",
        "PAYMENT.CAPTURE.DECLINED"
    ].includes(webhookEvent.event_type)){
        const captureId = resource.id || null;
        console.log("[PayPal Webhook] Mapper getPayPalCaptureId for capture event:", captureId);
        return captureId;
    }

    console.log("[PayPal Webhook] Mapper getPayPalCaptureId: null");
    return null;
}

module.exports = {
    mapPayPalEventToPaymentState,
    getPayPalEventId,
    getPayPalOrderId,
    getPayPalCaptureId
};
