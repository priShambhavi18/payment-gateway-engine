const pool = require("../config/db");

async function createRefund(refund) {
  const query = `
        INSERT INTO refunds (
            id,
            payment_id,
            amount,
            status,
            provider_refund_id,
            reason
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
        )
    `;

  await pool.query(query, [
    refund.id,
    refund.paymentId,
    refund.amount,
    refund.status,
    refund.providerRefundId,
    refund.reason,
  ]);
}

async function getRefundById(refundId) {
  const query = `
        SELECT *
        FROM refunds
        WHERE id = $1
    `;

  const result = await pool.query(query, [refundId]);

  return result.rows[0];
}

async function getRefundsByPaymentId(paymentId) {
  const query = `
        SELECT *
        FROM refunds
        WHERE payment_id = $1
        ORDER BY created_at ASC
    `;

  const result = await pool.query(query, [paymentId]);

  return result.rows;
}

async function updateRefundStatus(refundId, status, providerRefundId = null) {
  const query = `
        UPDATE refunds
        SET status = $1,
            provider_refund_id =
                COALESCE(
                    $2,
                    provider_refund_id
                ),
            updated_at =
                CURRENT_TIMESTAMP
        WHERE id = $3
    `;

  await pool.query(query, [status, providerRefundId, refundId]);
}

module.exports = {
  createRefund,
  getRefundById,
  getRefundsByPaymentId,
  updateRefundStatus,
};
