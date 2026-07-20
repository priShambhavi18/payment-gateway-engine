require("dotenv").config();
const {
  startSettlementScheduler,
} = require("./src/schedulers/settlement.scheduler");

const { connectRedis } = require("./src/redis/redis.client");

const app = require("./src/app");
const { startWebhookRetryJob } = require("./src/jobs/webhook.retry.job");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 5000;

logger.info("Starting Payment Gateway Engine");

 startSettlementScheduler();

connectRedis()
  .then(() => {
    logger.info("Connected to Redis successfully");
  })
  .catch((err) => {
    logger.error("Failed to connect to Redis", {
      error: err.message,
    });
    process.exit(1);
  });

app.listen(PORT, () => {
  logger.info("Payment Gateway Engine running", {
    port: PORT,
  });

  if (process.env.WEBHOOK_RETRY_JOB_ENABLED !== "false") {
    startWebhookRetryJob();
  }

 
});

logger.info("Payment Gateway Engine started successfully");
