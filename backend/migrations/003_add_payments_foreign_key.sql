ALTER TABLE payments
ADD CONSTRAINT fk_payments_merchant
FOREIGN KEY (merchant_id)
REFERENCES merchants(id);