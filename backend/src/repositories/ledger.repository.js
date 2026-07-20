const pool = require("../config/db");

async function createLedgerEntries(entries) {
  const query = `
        INSERT INTO ledger_entries (
            transaction_id,
            account_id,
            payment_id,
            entry_type,
            amount,
            currency,
            reference_type,
            description
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
        )
    `;

  for (const entry of entries) {
    await pool.query(query, [
      entry.transactionId,
      entry.accountId,
      entry.paymentId,
      entry.entryType,
      entry.amount,
      entry.currency,
      entry.referenceType,
      entry.description,
    ]);
  }
}

module.exports = {
  createLedgerEntries,
};
