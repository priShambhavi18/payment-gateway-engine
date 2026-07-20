CREATE TABLE settlement_items (
    id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),

    settlement_id UUID NOT NULL
        REFERENCES settlements(id)
        ON DELETE RESTRICT,

    payment_id UUID NOT NULL
        REFERENCES payments(id)
        ON DELETE RESTRICT
        UNIQUE,

    amount NUMERIC(18,2)
    NOT NULL
    CHECK (amount > 0),

    created_at TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_settlement_items_settlement_id
ON settlement_items(settlement_id);

CREATE INDEX idx_settlement_items_payment_id
ON settlement_items(payment_id);