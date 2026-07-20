CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    request_hash VARCHAR(255) NOT NULL,
    payment_id UUID NOT NULL,
    response_body JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT  CURRENT_TIMESTAMP,

    CONSTRAINT fk_idempotency_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants(id),
    CONSTRAINT fk_idempotency_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id),
    CONSTRAINT unique_idempotency_key_per_merchant
    UNIQUE (merchant_id, idempotency_key) 
);