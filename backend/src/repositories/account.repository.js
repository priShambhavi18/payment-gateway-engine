const pool = require("../config/db");

async function createMerchantAccount(merchantId) {
    const query = `
        INSERT INTO accounts (
            account_type,
            reference_id,
            currency,
            status
        )
        VALUES ($1, $2, $3, $4)
    `;

    await pool.query(query, [
        'MERCHANT',
        merchantId,
        'USD',
        'ACTIVE'
    ]);
}

async function getGatewayHoldingAccount() {
    const query = `
        SELECT *
        FROM accounts
        WHERE account_type = $1
        LIMIT 1
    `;

    const result = await pool.query(query, [
        'GATEWAY_HOLDING'
    ]);

    return result.rows[0];
}

async function getGatewayFeeAccount() {
    const query = `
        SELECT *
        FROM accounts
        WHERE account_type = $1
        LIMIT 1
    `;

    const result = await pool.query(query, [
        'GATEWAY_FEE'
    ]);

    return result.rows[0];
}

async function getMerchantAccount( merchantId) {
    const query = `
        SELECT *
        FROM accounts
        WHERE account_type = $1
        AND reference_id = $2
        LIMIT 1
    `;

    const result = await pool.query(query, [
        'MERCHANT',
        merchantId
    ]);

    return result.rows[0];
}

module.exports = {
    createMerchantAccount,
    getGatewayHoldingAccount,
    getGatewayFeeAccount,
    getMerchantAccount
};