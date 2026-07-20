const axios = require("axios");

async function getPayPalAccessToken() {
  try {
    const response = await axios({
      method: "post",
      url: process.env.PAYPAL_BASE_URL + "/v1/oauth2/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.PAYPAL_CLIENT_ID +
              ":" +
              process.env.PAYPAL_CLIENT_SECRET,
          ).toString("base64"),
      },
      data: "grant_type=client_credentials",
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Error fetching PayPal access token:", error);
    throw error;
  }
}

async function createPayPalPayment(payment) {
  try {
    const accessToken = await getPayPalAccessToken();
    const baseUrl = process.env.BACKEND_BASE_URL || "http://localhost:5000";

    const response = await axios({
      method: "post",
      url: `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: payment.currency,
              value: String(payment.amount),
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
              brand_name: "My Payment Gateway",
              shipping_preference: "NO_SHIPPING",
              locale: "en-US",
              landing_page: "LOGIN",
              user_action: "PAY_NOW",
              return_url: `${baseUrl}/payments/paypal/success?paymentId=${payment.id}`,
              cancel_url: `${baseUrl}/payments/paypal/cancel?paymentId=${payment.id}`,
            },
          },
        },
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error creating PayPal payment:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

async function capturePayPalPayment(orderId) {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await axios({
      method: "post",
      url: `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error capturing PayPal payment:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

async function refundPayPalPayment(captureId, amount, currency) {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await axios({
      method: "post",

      url: `${process.env.PAYPAL_BASE_URL}/v2/payments/captures/${captureId}/refund`,

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${accessToken}`,
      },

      data: {
        amount: {
          value: String(amount),

          currency_code: currency,
        },
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error refunding PayPal payment:",
      error.response?.data || error.message,
    );

    throw error;
  }
}

module.exports = {
  getPayPalAccessToken,
  createPayPalPayment,
  capturePayPalPayment,
  refundPayPalPayment,
};
