const cron = require("node-cron");

const { runSettlementWorker } = require("../workers/settlement.worker");

function startSettlementScheduler() {
  cron.schedule("0 2 * * *", async () => {
    console.log("Running daily settlement job...");

    await runSettlementWorker();
  });

  console.log("Settlement scheduler started.");
}

module.exports = {
  startSettlementScheduler,
};
