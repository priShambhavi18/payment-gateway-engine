const { randomUUID } = require("crypto");
const {
    getPaymentByProviderTransactionId,
    getPaymentByProviderCaptureId,
    updatePayment,
    updatePaymentProviderCaptureId
} = require("../repositories/payment.repository");
const {
    WEBHOOK_EVENT_STATUSES,
    insertWebhookEvent,
    getWebhookEventByEventId,
    markWebhookEventProcessing,
    markWebhookEventProcessed,
    markWebhookEventFailed,
    updateWebhookEventPaymentId
} = require("../repositories/webhookEvent.repository");
const logger = require("../utils/logger");
const {
    mapPayPalEventToPaymentState,
    getPayPalEventId,
    getPayPalOrderId,
    getPayPalCaptureId
} = require("./webhook.event.mapper");

const PAYPAL_PROVIDER = "paypal";

function getSafeErrorMessage(error) {
    return error?.message || "Unknown webhook processing error";
}

async function processPayPalWebhookEvent(webhookEvent, webhookEventId = null) {
    console.log("[PayPal Webhook] 9. Processing webhook payload into payment update");

    const targetState = mapPayPalEventToPaymentState(webhookEvent.event_type);

    console.log("[PayPal Webhook] 9a. Mapped PayPal event to payment state:", {
        eventType: webhookEvent.event_type,
        targetState
    });

    if(!targetState){
        console.log("[PayPal Webhook] Unsupported event type. No payment update needed.");
        return {
            handled: false,
            reason: "unsupported_event",
            eventType: webhookEvent.event_type
        };
    }

    const orderId = getPayPalOrderId(webhookEvent);
    const captureId = getPayPalCaptureId(webhookEvent);
    console.log("[PayPal Webhook] 9b. Extracted PayPal IDs from event:", {
        orderId,
        captureId
    });

    if(!orderId && !captureId){
        console.log("[PayPal Webhook] Missing both orderId and captureId. Cannot link webhook to payment.");
        throw new Error("PayPal order id or capture id not found in webhook event");
    }

    console.log("[PayPal Webhook] 9c. Looking for payment by provider_transaction_id:", orderId);
    let payment = orderId ? await getPaymentByProviderTransactionId(orderId) : null;

    if(!payment && captureId){
        console.log("[PayPal Webhook] 9d. Payment not found by orderId. Looking by provider_capture_id:", captureId);
        payment = await getPaymentByProviderCaptureId(captureId);
    }

    if(!payment){
        console.log("[PayPal Webhook] Payment lookup failed for PayPal reference:", orderId || captureId);
        throw new Error(`Payment not found for PayPal reference ${orderId || captureId}`);
    }

    console.log("[PayPal Webhook] 10. Matched payment:", {
        paymentId: payment.id,
        currentStatus: payment.status,
        providerTransactionId: payment.provider_transaction_id,
        providerCaptureId: payment.provider_capture_id
    });

    if(webhookEventId){
        console.log("[PayPal Webhook] 10a. Linking webhook event row to payment:", {
            webhookEventId,
            paymentId: payment.id
        });
        await updateWebhookEventPaymentId(webhookEventId, payment.id);
    }

    const providerTransactionId = orderId || payment.provider_transaction_id;

    // Retries can safely no-op when the original delivery already moved the payment.
    if(payment.status === targetState){
        console.log("[PayPal Webhook] 11. Payment already has target status. Treating as duplicate/no-op.", {
            paymentId: payment.id,
            status: payment.status,
            captureId
        });

        if(captureId && !payment.provider_capture_id){
            console.log("[PayPal Webhook] 11a. Existing payment is missing captureId. Saving captureId:", captureId);
            await updatePaymentProviderCaptureId(payment.id, captureId);
        }

        return {
            handled: false,
            reason: "duplicate_event",
            paymentId: payment.id,
            orderId: providerTransactionId,
            status: payment.status,
            captureId
        };
    }

    console.log("[PayPal Webhook] 11. Updating payment status:", {
        paymentId: payment.id,
        from: payment.status,
        to: targetState,
        providerTransactionId,
        captureId
    });
    await updatePayment(payment.id, targetState, PAYPAL_PROVIDER, providerTransactionId, captureId);

    console.log("[PayPal Webhook] 12. Payment update complete:", {
        paymentId: payment.id,
        status: targetState
    });

    return {
        handled: true,
        paymentId: payment.id,
        orderId: providerTransactionId,
        status: targetState,
        captureId
    };
}

async function persistPayPalWebhookEvent(webhookEvent) {
    const eventId = getPayPalEventId(webhookEvent);
    const eventType = webhookEvent.event_type;

    console.log("[PayPal Webhook] 7. Persisting webhook event:", {
        eventId,
        eventType
    });

    if(!eventId){
        console.log("[PayPal Webhook] Missing PayPal webhook event id.");
        throw new Error("PayPal webhook event id not found");
    }

    if(!eventType){
        console.log("[PayPal Webhook] Missing PayPal webhook event type.");
        throw new Error("PayPal webhook event type not found");
    }

    const webhookEventRowId = randomUUID();
    console.log("[PayPal Webhook] 7a. Inserting webhook event row:", {
        webhookEventRowId,
        provider: PAYPAL_PROVIDER,
        eventId,
        eventType,
        status: WEBHOOK_EVENT_STATUSES.PENDING
    });

    const insertedEvent = await insertWebhookEvent({
        id: webhookEventRowId,
        provider: PAYPAL_PROVIDER,
        eventId,
        eventType,
        payload: webhookEvent,
        status: WEBHOOK_EVENT_STATUSES.PENDING
    });
    console.log("[PayPal Webhook] 7b. Insert webhook result:", insertedEvent ? {
        id: insertedEvent.id,
        eventId: insertedEvent.event_id,
        status: insertedEvent.status
    } : null);
    

    if(insertedEvent){
        return {
            event: insertedEvent,
            duplicate: false
        };
    }

    console.log("[PayPal Webhook] 7c. Duplicate event_id found. Loading existing webhook event:", eventId);
    return {
        event: await getWebhookEventByEventId(eventId),
        duplicate: true
    };
}

async function processPersistedPayPalWebhookEvent(webhookEventRecord) {
    console.log("[PayPal Webhook] 8. Processing persisted webhook row:", {
        webhookEventId: webhookEventRecord.id,
        eventId: webhookEventRecord.event_id,
        eventType: webhookEventRecord.event_type,
        status: webhookEventRecord.status,
        retryCount: webhookEventRecord.retry_count
    });

    console.log("[PayPal Webhook] 8a. Marking webhook event PROCESSING:", webhookEventRecord.id);
    await markWebhookEventProcessing(webhookEventRecord.id);

    try {
        const result = await processPayPalWebhookEvent(webhookEventRecord.payload, webhookEventRecord.id);
        console.log("[PayPal Webhook] 13. Marking webhook event PROCESSED:", {
            webhookEventId: webhookEventRecord.id,
            paymentId: result.paymentId || null
        });
        await markWebhookEventProcessed(webhookEventRecord.id, result.paymentId);

        logger.info("Webhook processing success", {
            provider: webhookEventRecord.provider,
            eventId: webhookEventRecord.event_id,
            eventType: webhookEventRecord.event_type,
            paymentId: result.paymentId || null,
            handled: result.handled
        });

        return result;
    } catch (error) {
        console.log("[PayPal Webhook] Processing failed. Marking webhook event FAILED:", {
            webhookEventId: webhookEventRecord.id,
            error: getSafeErrorMessage(error)
        });
        const failedEvent = await markWebhookEventFailed(webhookEventRecord.id, getSafeErrorMessage(error));

        logger.error("Webhook processing failure", {
            provider: webhookEventRecord.provider,
            eventId: webhookEventRecord.event_id,
            eventType: webhookEventRecord.event_type,
            retryCount: failedEvent?.retry_count,
            error: getSafeErrorMessage(error)
        });

        return {
            handled: false,
            reason: "processing_failed",
            eventId: webhookEventRecord.event_id,
            eventType: webhookEventRecord.event_type,
            retryCount: failedEvent?.retry_count,
            error: getSafeErrorMessage(error)
        };
    }
}

async function handlePayPalWebhook(webhookEvent) {
    const eventId = getPayPalEventId(webhookEvent);

    console.log("[PayPal Webhook] 6. Service handling webhook:", {
        provider: PAYPAL_PROVIDER,
        eventId,
        eventType: webhookEvent.event_type
    });

    logger.info("Webhook received", {
        provider: PAYPAL_PROVIDER,
        eventId,
        eventType: webhookEvent.event_type
    });

    try {
        const persistedEvent = await persistPayPalWebhookEvent(webhookEvent);

        console.log("[PayPal Webhook] Persist result:", {
            duplicate: persistedEvent.duplicate,
            webhookEventId: persistedEvent.event?.id,
            status: persistedEvent.event?.status
        });

        if(persistedEvent.duplicate){
            console.log("[PayPal Webhook] Duplicate webhook delivery. Returning without payment update:", {
                eventId,
                existingStatus: persistedEvent.event?.status
            });

            logger.warn("Duplicate webhook received", {
                provider: PAYPAL_PROVIDER,
                eventId,
                eventType: webhookEvent.event_type
            });

            return {
                handled: false,
                duplicate: true,
                reason: "duplicate_webhook_delivery",
                eventId,
                status: persistedEvent.event?.status
            };
        }

        return await processPersistedPayPalWebhookEvent(persistedEvent.event);
    } catch (error) {
        console.log("[PayPal Webhook] Service caught webhook processing error:", getSafeErrorMessage(error));
        logger.error("Webhook processing failure", {
            provider: PAYPAL_PROVIDER,
            eventId,
            eventType: webhookEvent.event_type,
            error: getSafeErrorMessage(error)
        });

        return {
            handled: false,
            reason: "webhook_processing_failed",
            eventId,
            eventType: webhookEvent.event_type,
            error: getSafeErrorMessage(error)
        };
    }
}

module.exports = {
    handlePayPalWebhook,
    processPayPalWebhookEvent,
    processPersistedPayPalWebhookEvent
};
