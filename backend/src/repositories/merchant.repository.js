const pool = require("../config/db");

async function insertMerchant(merchant) {
  const query = `
    INSERT INTO merchants (
      id,
      name,
      api_key,
      email
    )
    VALUES ($1, $2, $3,$4)
  `;

  await pool.query(query, [
    merchant.id,
    merchant.name,
    merchant.apiKey,
    merchant.email,
  ]);
}

async function getMerchantByApiKey(apiKey) {
  const query = `
    SELECT *
    FROM merchants
    WHERE api_key = $1
  `;

  const result = await pool.query(query, [apiKey]);
  return result.rows[0];
}

async function getAllMerchants() {
  const query = `
        SELECT *
        FROM merchants
        WHERE status = 'active'
    `;

  const result = await pool.query(query);

  return result.rows;
}

module.exports = {
  insertMerchant,
  getMerchantByApiKey,
  getAllMerchants
};
