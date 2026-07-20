ALTER TABLE payments
ADD COLUMN gateway_fee_amount
NUMERIC(18,2)
DEFAULT 0
CHECK (
    gateway_fee_amount >= 0
);

ALTER TABLE payments
ADD COLUMN merchant_amount
NUMERIC(18,2)
DEFAULT 0
CHECK (
    merchant_amount >= 0
);