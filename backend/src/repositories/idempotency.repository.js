const pool = require("../config/db");

async function insertIdempotencyKey(data) {
    const query = `
        INSERT INTO idempotency_keys (id, 
        merchant_id,
        idempotency_key,
        request_hash,
        payment_id,
        response_body)
        VALUES ($1, $2, $3, $4, $5, $6)
        returning *
    `;
    const result = await pool.query(query, [data.id, data.merchant_id, data.idempotency_key, data.request_hash, data.payment_id, JSON.stringify(data.response_body)]);
    return result.rows[0];
}

async function getIdempotencyKey(merchantId, idempotencyKey) {
    const query = `
        SELECT * FROM idempotency_keys
        WHERE merchant_id = $1 AND idempotency_key = $2
    `;
    const result = await pool.query(query, [merchantId, idempotencyKey]);
    return result.rows[0];
}

module.exports = {
    insertIdempotencyKey,
    getIdempotencyKey
};
