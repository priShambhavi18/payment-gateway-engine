const webhookRetryService = require("../webhooks/webhook.retry.service");
const logger = require("../utils/logger");

const WEBHOOK_RETRY_INTERVAL_MS = 60 * 1000;

let retryJobInterval = null;
let isRetryJobRunning = false;

function startWebhookRetryJob() {
    if(retryJobInterval){
        return retryJobInterval;
    }

    retryJobInterval = setInterval(async () => {
        // Keep one in-process retry loop active at a time.
        if(isRetryJobRunning){
            logger.warn("Webhook retry job skipped because previous run is still active");
            return;
        }

        isRetryJobRunning = true;

        try {
            await webhookRetryService.retryFailedWebhookEvents();
        } catch (error) {
            logger.error("Webhook retry job failed", {
                error: error.message
            });
        } finally {
            isRetryJobRunning = false;
        }
    }, WEBHOOK_RETRY_INTERVAL_MS);

    logger.info("Webhook retry job started", {
        intervalMs: WEBHOOK_RETRY_INTERVAL_MS
    });

    return retryJobInterval;
}

function stopWebhookRetryJob() {
    if(!retryJobInterval){
        return;
    }

    clearInterval(retryJobInterval);
    retryJobInterval = null;
    isRetryJobRunning = false;
}

module.exports = {
    startWebhookRetryJob,
    stopWebhookRetryJob
};
