const { getAllMerchantsService } = require("../services/merchant.service");
const { createSettlementForMerchant } = require("../services/settlement.service");

async function runSettlementWorker() {
  console.log("Starting settlement worker...");

  const merchants = await getAllMerchantsService();

  for (const merchant of merchants) {
    try {
      console.log(`Processing settlement for merchant: ${merchant.id}`);

      await createSettlementForMerchant(merchant.id);

      console.log(`Settlement completed for merchant: ${merchant.id}`);
    } catch (error) {
      console.error(
        `Settlement failed for merchant: ${merchant.id}`,
        error.message,
      );
    }
  }
  console.log("Settlement worker completed.");
}

module.exports = {
  runSettlementWorker,
};
