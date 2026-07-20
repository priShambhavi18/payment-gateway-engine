const { randomUUID, createHash } = require("crypto");
const {
  insertPayment,
  getPaymentById,
  updatePayment,
} = require("../repositories/payment.repository");
const {
  insertIdempotencyKey,
  getIdempotencyKey,
} = require("../repositories/idempotency.repository");
const {
  createPayPalPayment,
  capturePayPalPayment,
} = require("../providers/paypal/paypal.provider");
const { PAYMENT_STATES } = require("../constants/payment.states");

const {
  getGatewayHoldingAccount,
  getGatewayFeeAccount,
  getMerchantAccount,
} = require("../repositories/account.repository");

const { createLedgerEntries } = require("../repositories/ledger.repository");

const {
  createRefund,
  getRefundsByPaymentId,
  updateRefundStatus,
} = require("../repositories/refund.repository");

const { refundPayPalPayment } = require("../providers/paypal/paypal.provider");

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function createRequestHash(data) {
  return createHash("sha256").update(stableStringify(data)).digest("hex");
}

function formatPaymentResponse(payment) {
  return {
    paymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
  };
}

async function getIdempotentResponse(merchantId, idempotencyKey, requestHash) {
  if (!idempotencyKey) {
    return null;
  }

  const existingKey = await getIdempotencyKey(merchantId, idempotencyKey);

  if (!existingKey) {
    return null;
  }

  if (existingKey.request_hash !== requestHash) {
    throw new Error(
      "Idempotency-Key was already used with a different request",
    );
  }

  return existingKey.response_body;
}

async function saveIdempotentResponse(
  merchantId,
  idempotencyKey,
  requestHash,
  paymentId,
  responseBody,
) {
  if (!idempotencyKey) {
    return;
  }

  await insertIdempotencyKey({
    id: randomUUID(),
    merchant_id: merchantId,
    idempotency_key: idempotencyKey,
    request_hash: requestHash,
    payment_id: paymentId,
    response_body: responseBody,
  });
}

async function createPaymentService(data, merchant, idempotencyKey) {
  const requestHash = createRequestHash({
    action: "createPayment",
    amount: data.amount,
    currency: data.currency,
  });
  const idempotentResponse = await getIdempotentResponse(
    merchant.id,
    idempotencyKey,
    requestHash,
  );

  if (idempotentResponse) {
    return idempotentResponse;
  }

  const payment = {
    id: randomUUID(),
    amount: data.amount,
    currency: data.currency,
    merchantId: merchant.id,
    status: PAYMENT_STATES.PENDING,
    sessionId: randomUUID(),
    provider: null,
    provider_transaction_Id: null,
  };
  await insertPayment(payment);
  const response = formatPaymentResponse(payment);

  await saveIdempotentResponse(
    merchant.id,
    idempotencyKey,
    requestHash,
    payment.id,
    response,
  );
  return response;
}

async function processPayment(paymentId, merchantId, idempotencyKey) {
  const requestHash = createRequestHash({
    action: "processPayment",
    paymentId,
  });
  const idempotentResponse = await getIdempotentResponse(
    merchantId,
    idempotencyKey,
    requestHash,
  );

  if (idempotentResponse) {
    return idempotentResponse;
  }

  const payment = await getPaymentById(paymentId);
  {
    if (!payment) {
      throw new Error("Payment not found");
    }
    if (payment.merchant_id !== merchantId) {
      throw new Error("Unauthorized");
    }
    if (payment.status !== PAYMENT_STATES.PENDING) {
      throw new Error("Payment already processed");
    }
    const paypalResponse = await createPayPalPayment({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
    });
    const approvalUrl = paypalResponse.links?.find(
      (link) => link.rel === "payer-action" || link.rel === "approve",
    )?.href;

    if (!approvalUrl) {
      throw new Error("PayPal approval URL not found");
    }

    await updatePayment(
      paymentId,
      PAYMENT_STATES.PROCESSING,
      "paypal",
      paypalResponse.id,
    );
    const response = {
      paymentId: payment.id,
      orderId: paypalResponse.id,
      approvalUrl,
      status: PAYMENT_STATES.PROCESSING,
    };

    await saveIdempotentResponse(
      merchantId,
      idempotencyKey,
      requestHash,
      payment.id,
      response,
    );
    return response;
  }
}

async function capturePaymentService(paymentId, orderId) {
  const payment = await getPaymentById(paymentId);

  if (!payment) {
    throw new Error("Payment not found");
  }
  if (payment.provider_transaction_id !== orderId) {
    throw new Error("Invalid order id for this payment");
  }

  const idempotencyKey = `capture-${paymentId}`;
  const requestHash = createRequestHash({
    action: "capturePayment",
    paymentId,
    orderId,
  });

  const idempotentResponse = await getIdempotentResponse(
    payment.merchant_id,
    idempotencyKey,
    requestHash,
  );

  if (idempotentResponse) {
    return idempotentResponse;
  }

  if (payment.status === PAYMENT_STATES.CAPTURED) {
    const response = {
      paymentId: payment.id,
      orderId: payment.provider_transaction_id,
      status: PAYMENT_STATES.CAPTURED,
      captureId: payment.provider_capture_id,
    };
    await saveIdempotentResponse(
      payment.merchant_id,
      idempotencyKey,
      requestHash,
      payment.id,
      response,
    );
    return response;
  }

  if (payment.status !== PAYMENT_STATES.PROCESSING) {
    throw new Error("Payment is not ready to capture");
  }

  const paypalResponse = await capturePayPalPayment(orderId);
  const captureId =
    paypalResponse.purchase_units?.[0]?.payments?.captures?.[0]?.id;

  if (!captureId) {
    throw new Error("Capture ID not found in PayPal response");
  }
  await updatePayment(
    paymentId,
    PAYMENT_STATES.CAPTURED,
    "paypal",
    orderId,
    captureId,
    gatewayFeeAmount,
    merchantAmount
  );

  const transactionId = randomUUID();

  const gatewayHolding = await getGatewayHoldingAccount();

  const gatewayFee = await getGatewayFeeAccount();

  const merchantAccount = await getMerchantAccount(payment.merchant_id);

  const paymentAmount = Number(payment.amount);

  const feePercentage = 0.02;

  const gatewayFeeAmount = Number((paymentAmount * feePercentage).toFixed(2));

  const merchantAmount = Number((paymentAmount - gatewayFeeAmount).toFixed(2));

  await createLedgerEntries([
    {
      transactionId,
      accountId: gatewayHolding.id,
      paymentId: payment.id,
      entryType: "CREDIT",
      amount: payment.amount,
      currency: payment.currency,
      referenceType: "PAYMENT",
      description: "Money received into gateway holding",
    },

    {
      transactionId,
      accountId: merchantAccount.id,
      paymentId: payment.id,
      entryType: "DEBIT",
      amount: merchantAmount,
      currency: payment.currency,
      referenceType: "PAYMENT",
      description: "Merchant settlement pending",
    },

    {
      transactionId,
      accountId: gatewayFee.id,
      paymentId: payment.id,
      entryType: "DEBIT",
      amount: gatewayFeeAmount,
      currency: payment.currency,
      referenceType: "PAYMENT",
      description: "Gateway fee collected",
    },
  ]);

  const response = {
    paymentId: payment.id,
    orderId,
    status: PAYMENT_STATES.CAPTURED,
    captureId,
  };
  await saveIdempotentResponse(
    payment.merchant_id,
    idempotencyKey,
    requestHash,
    payment.id,
    response,
  );

  return response;
}

async function refundPaymentService(paymentId, merchantId, refundAmount, reason = null) {
  const payment = await getPaymentById(paymentId);

  if (payment.merchant_id !== merchantId) {
    throw new Error("Unauthorized: Payment does not belong to the requesting merchant");
  } 

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status !== PAYMENT_STATES.CAPTURED) {
    throw new Error("Only captured payments can be refunded");
  }

  const previousRefunds = await getRefundsByPaymentId(paymentId);

  const totalRefunded = previousRefunds.reduce(
    (sum, refund) => sum + Number(refund.amount),
    0,
  );

  const paymentAmount = Number(payment.amount);

  const requestedRefund = Number(refundAmount);

  if (totalRefunded + requestedRefund > paymentAmount) {
    throw new Error("Refund amount exceeds payment amount");
  }

  const refund = {
    id: randomUUID(),
    paymentId,
    amount: requestedRefund,
    status: "PENDING",
    providerRefundId: null,
    reason,
  };

  await createRefund(refund);

  const paypalRefund = await refundPayPalPayment(
    payment.provider_capture_id,
    requestedRefund,
    payment.currency,
  );

  await updateRefundStatus(refund.id, "SUCCEEDED", paypalRefund.id);

  const transactionId = randomUUID();

  const gatewayHolding = await getGatewayHoldingAccount();

  const gatewayFee = await getGatewayFeeAccount();

  const merchantAccount = await getMerchantAccount(payment.merchant_id);

  const feePercentage = 0.02;

  const gatewayFeeAmount = Number((requestedRefund * feePercentage).toFixed(2));

  const merchantAmount = Number(
    (requestedRefund - gatewayFeeAmount).toFixed(2),
  );

  await createLedgerEntries([
    {
      transactionId,
      accountId: gatewayHolding.id,
      paymentId: payment.id,
      entryType: "DEBIT",

      amount: requestedRefund,

      currency: payment.currency,

      referenceType: "REFUND",

      description: "Refund issued from gateway holding",
    },

    {
      transactionId,
      accountId: merchantAccount.id,

      paymentId: payment.id,

      entryType: "CREDIT",

      amount: merchantAmount,

      currency: payment.currency,

      referenceType: "REFUND",

      description: "Merchant refund reversal",
    },

    {
      transactionId,
      accountId: gatewayFee.id,

      paymentId: payment.id,

      entryType: "CREDIT",

      amount: gatewayFeeAmount,

      currency: payment.currency,

      referenceType: "REFUND",

      description: "Gateway fee reversed",
    },
  ]);

  return {
    refundId: refund.id,

    paymentId,

    amount: requestedRefund,

    status: "SUCCEEDED",
  };
}

module.exports = {
  createPaymentService,
  processPayment,
  capturePaymentService,
  refundPaymentService,
};
