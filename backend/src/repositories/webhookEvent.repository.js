const pool = require("../config/db");

const WEBHOOK_EVENT_STATUSES = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    PROCESSED: "PROCESSED",
    FAILED: "FAILED"
};

async function insertWebhookEvent(event) {
    console.log("[PayPal Webhook] DB insertWebhookEvent called:", {
        id: event.id,
        provider: event.provider,
        eventId: event.eventId,
        eventType: event.eventType,
        status: event.status
    });

    const query = `
        INSERT INTO webhook_events (
            id,
            provider,
            event_id,
            event_type,
            payment_id,
            payload,
            status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (event_id) DO NOTHING
        RETURNING *
    `;
    const result = await pool.query(query, [
        event.id,
        event.provider,
        event.eventId,
        event.eventType,
        event.paymentId || null,
        JSON.stringify(event.payload),
        event.status
    ]);

    console.log("[PayPal Webhook] DB insertWebhookEvent result:", result.rows[0] ? {
        id: result.rows[0].id,
        eventId: result.rows[0].event_id,
        status: result.rows[0].status
    } : null);

    return result.rows[0] || null;
}

async function getWebhookEventByEventId(eventId) {
    console.log("[PayPal Webhook] DB getWebhookEventByEventId called:", eventId);

    const query = `
        SELECT *
        FROM webhook_events
        WHERE event_id = $1
    `;
    const result = await pool.query(query, [eventId]);

    console.log("[PayPal Webhook] DB getWebhookEventByEventId result:", result.rows[0] ? {
        id: result.rows[0].id,
        eventId: result.rows[0].event_id,
        status: result.rows[0].status
    } : null);

    return result.rows[0];
}

async function markWebhookEventProcessing(id) {
    console.log("[PayPal Webhook] DB markWebhookEventProcessing called:", id);

    const query = `
        UPDATE webhook_events
        SET status = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
    `;
    const result = await pool.query(query, [WEBHOOK_EVENT_STATUSES.PROCESSING, id]);

    console.log("[PayPal Webhook] DB markWebhookEventProcessing result:", result.rows[0] ? {
        id: result.rows[0].id,
        status: result.rows[0].status
    } : null);

    return result.rows[0];
}

async function markWebhookEventProcessed(id, paymentId = null) {
    console.log("[PayPal Webhook] DB markWebhookEventProcessed called:", {
        id,
        paymentId
    });

    const query = `
        UPDATE webhook_events
        SET status = $1,
            payment_id = COALESCE($2, payment_id),
            error_message = NULL,
            processed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
    `;
    const result = await pool.query(query, [WEBHOOK_EVENT_STATUSES.PROCESSED, paymentId, id]);

    console.log("[PayPal Webhook] DB markWebhookEventProcessed result:", result.rows[0] ? {
        id: result.rows[0].id,
        status: result.rows[0].status,
        paymentId: result.rows[0].payment_id
    } : null);

    return result.rows[0];
}

async function markWebhookEventFailed(id, errorMessage) {
    console.log("[PayPal Webhook] DB markWebhookEventFailed called:", {
        id,
        errorMessage
    });

    const query = `
        UPDATE webhook_events
        SET status = $1,
            retry_count = retry_count + 1,
            error_message = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
    `;
    const result = await pool.query(query, [WEBHOOK_EVENT_STATUSES.FAILED, errorMessage, id]);

    console.log("[PayPal Webhook] DB markWebhookEventFailed result:", result.rows[0] ? {
        id: result.rows[0].id,
        status: result.rows[0].status,
        retryCount: result.rows[0].retry_count
    } : null);

    return result.rows[0];
}

async function updateWebhookEventPaymentId(id, paymentId) {
    console.log("[PayPal Webhook] DB updateWebhookEventPaymentId called:", {
        id,
        paymentId
    });

    const query = `
        UPDATE webhook_events
        SET payment_id = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
    `;
    const result = await pool.query(query, [paymentId, id]);

    console.log("[PayPal Webhook] DB updateWebhookEventPaymentId result:", result.rows[0] ? {
        id: result.rows[0].id,
        paymentId: result.rows[0].payment_id
    } : null);

    return result.rows[0];
}

async function getFailedWebhookEventsForRetry(limit = 50) {
    const query = `
        SELECT *
        FROM webhook_events
        WHERE status = $1
            AND retry_count < 5
        ORDER BY updated_at ASC
        LIMIT $2
    `;
    const result = await pool.query(query, [WEBHOOK_EVENT_STATUSES.FAILED, limit]);

    return result.rows;
}

async function claimFailedWebhookEventsForRetry(limit = 50) {
    const query = `
        -- Claim rows before returning them so concurrent retry workers do not process the same event.
        WITH retry_candidates AS (
            SELECT id
            FROM webhook_events
            WHERE status = $1
                AND retry_count < 5
            ORDER BY updated_at ASC
            LIMIT $2
            FOR UPDATE SKIP LOCKED
        )
        UPDATE webhook_events
        SET status = $3,
            updated_at = CURRENT_TIMESTAMP
        FROM retry_candidates
        WHERE webhook_events.id = retry_candidates.id
        RETURNING webhook_events.*
    `;
    const result = await pool.query(query, [
        WEBHOOK_EVENT_STATUSES.FAILED,
        limit,
        WEBHOOK_EVENT_STATUSES.PROCESSING
    ]);

    return result.rows;
}

module.exports = {
    WEBHOOK_EVENT_STATUSES,
    insertWebhookEvent,
    getWebhookEventByEventId,
    markWebhookEventProcessing,
    markWebhookEventProcessed,
    markWebhookEventFailed,
    updateWebhookEventPaymentId,
    getFailedWebhookEventsForRetry,
    claimFailedWebhookEventsForRetry
};
