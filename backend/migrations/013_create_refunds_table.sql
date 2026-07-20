CREATE TABLE refunds (
    id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),

    payment_id UUID NOT NULL
        REFERENCES payments(id)
        ON DELETE RESTRICT,

    amount NUMERIC(18,2)
    NOT NULL
    CHECK (amount > 0),

    status VARCHAR(20)
    NOT NULL
    DEFAULT 'PENDING'
    CHECK (
        status IN (
            'PENDING',
            'PROCESSING',
            'SUCCEEDED',
            'FAILED'
        )
    ),

    provider_refund_id VARCHAR(255),

    reason TEXT,

    created_at TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refunds_payment_id
ON refunds(payment_id);

CREATE INDEX idx_refunds_status
ON refunds(status);