const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middleware/auth.middleware");
const idempotencyMiddleware = require("../middleware/idempotency.middleware");
const rateLimitMiddleware = require("../middleware/rateLimit.middleware");

router.post(
  "/createPayment",
  authMiddleware,
  rateLimitMiddleware,
  idempotencyMiddleware.validateIdempotencyKey,
  paymentController.createPayment,
);
router.post(
  "/processPayment/:id",
  rateLimitMiddleware,
  idempotencyMiddleware.validateIdempotencyKey,
  paymentController.processPaymentController,
);
router.get("/paypal/success", paymentController.paypalSuccessController);
router.get("/paypal/cancel", paymentController.paypalCancelController);
router.post(
  "/refund/:paymentId",
  authMiddleware,
  rateLimitMiddleware,
  paymentController.refundPaymentController,
);
module.exports = router;
