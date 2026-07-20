CREATE TABLE webhook_events (
    id UUID PRIMARY KEY,

    provider VARCHAR(50) NOT NULL,

    event_id VARCHAR(255) NOT NULL,

    event_type VARCHAR(255) NOT NULL,

    payment_id UUID NULL,

    payload JSONB NOT NULL,

    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED')),

    retry_count INTEGER NOT NULL DEFAULT 0,

    error_message TEXT NULL,

    processed_at TIMESTAMP NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_webhook_event_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
        ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX idx_webhook_events_payment_id ON webhook_events(payment_id);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_retry_lookup ON webhook_events(status, retry_count, updated_at);
