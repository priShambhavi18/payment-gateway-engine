const pool = require("../config/db");

async function getUnsettledPayments(
    merchantId
) {
    const query = `
        SELECT
            p.id,
            p.amount,
            p.currency,
            p.created_at,
            p.merchant_amount
        FROM payments p

        LEFT JOIN settlement_items si
            ON p.id = si.payment_id

        WHERE p.merchant_id = $1
        AND p.status = 'CAPTURED'
        AND si.payment_id IS NULL
        AND DATE(p.created_at)
            < CURRENT_DATE
    `;

    const result =
        await pool.query(
            query,
            [merchantId]
        );

    return result.rows;
}

async function createSettlement(
    settlement
) {
    const query = `
        INSERT INTO settlements (
            id,
            merchant_id,
            total_amount,
            status,
            settlement_date
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5
        )
    `;

    await pool.query(query, [
        settlement.id,
        settlement.merchantId,
        settlement.totalAmount,
        settlement.status,
        settlement.settlementDate
    ]);
}

async function createSettlementItems(
    settlementId,
    payments
) {
    const query = `
        INSERT INTO settlement_items (
            settlement_id,
            payment_id,
            amount
        )
        VALUES (
            $1,
            $2,
            $3
        )
    `;

    for (
        const payment
        of payments
    ) {
        await pool.query(
            query,
            [
                settlementId,
                payment.id,
                payment.amount
            ]
        );
    }
}

module.exports = {
    getUnsettledPayments,
    createSettlement,
    createSettlementItems
};