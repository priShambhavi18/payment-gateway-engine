const { incrementCounter } = require("../redis/redis.service");

const RATE_LIMIT = 5;

const WINDOW_SECONDS = 60;

const rateLimitMiddleware = async (req, res, next) => {
  try {
    const merchant = req.merchant;

    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: "Merchant not authenticated",
      });
    }

    const key = `rate_limit:${merchant.id}`;

    const requestCount = await incrementCounter(key, WINDOW_SECONDS);

    console.log(`Rate limit count: ${requestCount}`);

    if (requestCount > RATE_LIMIT) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }

    next();
  } catch (error) {
    console.error("Rate limit error:", error);

    return res.status(500).json({
      success: false,
      message: "Rate limiting failed",
    });
  }
};

module.exports = rateLimitMiddleware;
