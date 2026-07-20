CREATE TABLE payments (
    id UUID PRIMARY KEY,

    merchant_id UUID NOT NULL,

    session_id UUID NOT NULL,

    amount BIGINT NOT NULL,

    currency VARCHAR(10) NOT NULL,

    status VARCHAR(20) NOT NULL,

    provider VARCHAR(50),

    provider_transaction_id VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);