CREATE TABLE settlements (
    id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),

    merchant_id UUID NOT NULL
        REFERENCES merchants(id)
        ON DELETE RESTRICT,

    total_amount NUMERIC(18,2)
    NOT NULL
    CHECK (total_amount >= 0),

    status VARCHAR(20)
    NOT NULL
    DEFAULT 'PENDING'
    CHECK (
        status IN (
            'PENDING',
            'PROCESSING',
            'COMPLETED',
            'FAILED'
        )
    ),

    settlement_date DATE
    NOT NULL,

    created_at TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settlements_merchant_id
ON settlements(merchant_id);

CREATE INDEX idx_settlements_status
ON settlements(status);