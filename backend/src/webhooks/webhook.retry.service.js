const {
    claimFailedWebhookEventsForRetry,
    markWebhookEventFailed
} = require("../repositories/webhookEvent.repository");
const { processPersistedPayPalWebhookEvent } = require("./webhook.service");
const logger = require("../utils/logger");

const MAX_WEBHOOK_RETRY_COUNT = 5;

async function retryWebhookEvent(webhookEvent) {
    logger.info("Retrying webhook event", {
        provider: webhookEvent.provider,
        eventId: webhookEvent.event_id,
        eventType: webhookEvent.event_type,
        retryCount: webhookEvent.retry_count
    });

    if(webhookEvent.provider !== "paypal"){
        const failedEvent = await markWebhookEventFailed(
            webhookEvent.id,
            `Unsupported webhook provider for retry: ${webhookEvent.provider}`
        );

        logger.warn("Webhook retry skipped for unsupported provider", {
            provider: webhookEvent.provider,
            eventId: webhookEvent.event_id,
            retryCount: failedEvent?.retry_count
        });

        return {
            retried: true,
            result: {
                reason: "processing_failed",
                retryCount: failedEvent?.retry_count,
                error: `Unsupported webhook provider for retry: ${webhookEvent.provider}`
            }
        };
    }

    const result = await processPersistedPayPalWebhookEvent(webhookEvent);

    if(result.reason === "processing_failed" && result.retryCount >= MAX_WEBHOOK_RETRY_COUNT){
        logger.warn("Webhook retry exhausted", {
            provider: webhookEvent.provider,
            eventId: webhookEvent.event_id,
            eventType: webhookEvent.event_type,
            retryCount: result.retryCount,
            error: result.error
        });
    }

    return {
        retried: true,
        result
    };
}

async function retryFailedWebhookEvents(limit = 50) {
    const failedWebhookEvents = await claimFailedWebhookEventsForRetry(limit);
    const summary = {
        total: failedWebhookEvents.length,
        retried: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0
    };

    for (const webhookEvent of failedWebhookEvents) {
        const retryResult = await retryWebhookEvent(webhookEvent);

        if(!retryResult.retried){
            summary.skipped += 1;
            continue;
        }

        summary.retried += 1;

        if(retryResult.result.reason === "processing_failed"){
            summary.failed += 1;
            continue;
        }

        summary.succeeded += 1;
    }

    if(summary.total > 0){
        logger.info("Webhook retry batch completed", summary);
    }

    return summary;
}

module.exports = {
    MAX_WEBHOOK_RETRY_COUNT,
    retryFailedWebhookEvents,
    retryWebhookEvent
};
