const paymentService = require("../services/payment.services");

async function createPayment(req, res, next) {
  try {
    const payment = await paymentService.createPaymentService(
      req.body,
      req.merchant,
      req.idempotencyKey,
    );
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
}

async function processPaymentController(req, res) {
  try {
    const paymentId = req.params.id;
    const merchantId = req.merchant.id;
    const response = await paymentService.processPayment(
      paymentId,
      merchantId,
      req.idempotencyKey,
    );

    if (req.query.redirect === "true") {
      return res.redirect(response.approvalUrl);
    }

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function paypalSuccessController(req, res) {
  try {
    const { paymentId, token } = req.query;
    await paymentService.capturePaymentService(paymentId, token);

    return res.redirect(
      process.env.PAYMENT_SUCCESS_URL ||
        "http://localhost:5000/payment-success",
    );
  } catch (err) {
    return res.redirect(
      process.env.PAYMENT_FAILURE_URL || "http://localhost:5000/payment-cancel",
    );
  }
}

async function paypalCancelController(req, res) {
  return res.redirect(
    process.env.PAYMENT_FAILURE_URL || "http://localhost:5000/payment-cancel",
  );
}

async function refundPaymentController(req, res) {
  try {
    const { paymentId } = req.params;

    const { amount, reason } = req.body;

    const merchant = req.merchant;

    const refund = await paymentService.refundPaymentService(
      paymentId,
      merchant.id,
      amount,
      reason,
    );

    return res.status(200).json(refund);
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
}

module.exports = {
  createPayment,
  processPaymentController,
  paypalSuccessController,
  paypalCancelController,
  refundPaymentController,
};
