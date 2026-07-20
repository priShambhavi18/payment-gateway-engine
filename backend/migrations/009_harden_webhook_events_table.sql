UPDATE webhook_events
SET retry_count = 0
WHERE retry_count IS NULL;

UPDATE webhook_events
SET created_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL;

UPDATE webhook_events
SET updated_at = CURRENT_TIMESTAMP
WHERE updated_at IS NULL;

ALTER TABLE webhook_events
ALTER COLUMN retry_count SET DEFAULT 0,
ALTER COLUMN retry_count SET NOT NULL,
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN updated_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_id
ON webhook_events(payment_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type
ON webhook_events(event_type);

CREATE INDEX IF NOT EXISTS idx_webhook_events_retry_lookup
ON webhook_events(status, retry_count, updated_at);
