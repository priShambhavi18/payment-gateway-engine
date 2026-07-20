const pool = require("../config/db");
const {
  assertPaymentStateTransition,
} = require("../utils/payment.state.machine");

async function insertPayment(payment) {
  const query = `
        INSERT INTO payments (
            id,    
            amount,
            currency,
            merchant_id,
            status,
            session_id,
            provider,
            provider_transaction_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
  await pool.query(query, [
    payment.id,
    payment.amount,
    payment.currency,
    payment.merchantId,
    payment.status,
    payment.sessionId,
    payment.provider,
    payment.provider_transaction_Id,
  ]);
}

async function getPaymentById(paymentId) {
  const query = `SELECT * FROM payments WHERE id = $1`;
  const result = await pool.query(query, [paymentId]);
  return result.rows[0];
}

async function getPaymentByProviderTransactionId(providerTransactionId) {
  const query = `SELECT * FROM payments WHERE provider_transaction_id = $1`;
  const result = await pool.query(query, [providerTransactionId]);
  return result.rows[0];
}

async function getPaymentByProviderCaptureId(providerCaptureId) {
  const query = `SELECT * FROM payments WHERE provider_capture_id = $1`;
  const result = await pool.query(query, [providerCaptureId]);
  return result.rows[0];
}

async function updatePayment(
  paymentId,
  status,
  provider,
  providerTransactionId,
  providerCaptureId = null,
  gatewayFeeAmount = null,
  merchantAmount = null,
) {
  const payment = await getPaymentById(paymentId);

  if (!payment) {
    throw new Error("Payment not found");
  }

  assertPaymentStateTransition(payment.status, status);

  const query = `
        UPDATE payments
        SET status = $1,
            provider = $2,
            provider_transaction_id = $3,
            provider_capture_id = COALESCE($4, provider_capture_id),
             gateway_fee_amount =
        COALESCE(
            $5,
            gateway_fee_amount
        ),

    merchant_amount =
        COALESCE(
            $6,
            merchant_amount
        ),

    updated_at =
        CURRENT_TIMESTAMP

WHERE id = $7
    `;
  await pool.query(query, [
    status,
    provider,
    providerTransactionId,
    providerCaptureId,
    gatewayFeeAmount,
    merchantAmount,
    paymentId,
  ]);
}

async function updatePaymentProviderCaptureId(paymentId, providerCaptureId) {
  const query = `
        UPDATE payments
        SET provider_capture_id = COALESCE(provider_capture_id, $1),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
    `;
  await pool.query(query, [providerCaptureId, paymentId]);
}

module.exports = {
  insertPayment,
  getPaymentById,
  getPaymentByProviderTransactionId,
  getPaymentByProviderCaptureId,
  updatePayment,
  updatePaymentProviderCaptureId,
};
