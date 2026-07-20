CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('MERCHANT', 'GATEWAY_HOLDING','GATEWAY_FEE')),

    reference_id UUID NULL,

    currency VARCHAR(10) NOT NULL,

    current_balance NUMERIC(18, 2) NOT NULL DEFAULT 0,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);