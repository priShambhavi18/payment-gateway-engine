/*
find eligible payments
↓
sum merchant_amount
↓
create settlement row
↓
create settlement_items
↓
ledger payout entry
↓
mark settlement completed
*/

const { randomUUID } = require("crypto");

const {
  getUnsettledPayments,
  createSettlement,
  createSettlementItems,
} = require("../repositories/settlement.repository");

const {
  getGatewayHoldingAccount,
  getMerchantAccount,
} = require("../repositories/account.repository");

const { createLedgerEntries } = require("../repositories/ledger.repository");

async function createSettlementForMerchant(merchantId) {
  const payments = await getUnsettledPayments(merchantId);

  if (payments.length === 0) {
    console.log(`No eligible payments for merchant: ${merchantId}`);

    return null;
  }

  const totalAmount = payments.reduce(
    (sum, payment) => sum + Number(payment.merchant_amount),
    0,
  );

  const settlementId = randomUUID();

  const settlementDate = new Date();

  await createSettlement({
    id: settlementId,
    merchantId,
    totalAmount,
    status: "COMPLETED",
    settlementDate,
  });

  await createSettlementItems(settlementId, payments);

  const gatewayHolding = await getGatewayHoldingAccount();

  const merchantAccount = await getMerchantAccount(merchantId);

  const transactionId = randomUUID();

  await createLedgerEntries([
    {
      transactionId,

      accountId: gatewayHolding.id,

      paymentId: null,

      entryType: "DEBIT",

      amount: totalAmount,

      currency: "USD",

      referenceType: "SETTLEMENT",

      description: "Merchant payout settlement",
    },

    {
      transactionId,

      accountId: merchantAccount.id,

      paymentId: null,

      entryType: "CREDIT",

      amount: totalAmount,

      currency: "USD",

      referenceType: "SETTLEMENT",

      description: "Merchant received settlement",
    },
  ]);

  return {
    settlementId,
    merchantId,
    totalAmount,
    paymentCount: payments.length,
    status: "COMPLETED",
  };
}

module.exports = {
  createSettlementForMerchant,
};
