CREATE TABLE payment_attempts (
    id UUID PRIMARY KEY,

    payment_id UUID NOT NULL,

    provider VARCHAR(50) NOT NULL,

    status VARCHAR(20) NOT NULL,

    failure_reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attempt_payment
    FOREIGN KEY (payment_id)
    REFERENCES payments(id)
);