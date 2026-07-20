CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    transaction_id UUID NOT NULL,

    account_id UUID NOT NULL
        REFERENCES accounts(id)
        ON DELETE RESTRICT,

    payment_id UUID NOT NULL
        REFERENCES payments(id)
        ON DELETE RESTRICT,

    entry_type VARCHAR(10)
    NOT NULL
    CHECK (
        entry_type IN (
            'DEBIT',
            'CREDIT'
        )
    ),

    amount NUMERIC(18,2)
    NOT NULL
    CHECK (amount > 0),

    currency VARCHAR(10)
    NOT NULL
    DEFAULT 'INR',

    reference_type VARCHAR(20)
    NOT NULL
    CHECK (
        reference_type IN (
            'PAYMENT',
            'REFUND',
            'CHARGEBACK',
            'SETTLEMENT'
        )
    ),

    description TEXT,

    created_at TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_entries_payment_id
ON ledger_entries(payment_id);

CREATE INDEX idx_ledger_entries_account_id
ON ledger_entries(account_id);

CREATE INDEX idx_ledger_entries_transaction_id
ON ledger_entries(transaction_id);