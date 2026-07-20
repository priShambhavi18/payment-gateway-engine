const merchantServices = require("../services/merchant.service");

const { getCache, setCache } = require("../redis/redis.service");

const authMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "API key is missing",
      });
    }

    const cacheKey = `merchant:${apiKey}`;

    let merchant = await getCache(cacheKey);

    if (!merchant) {
      console.log("Cache miss");

      merchant = await merchantServices.getMerchantByApiKeyService(apiKey);

      if (merchant) {
        await setCache(cacheKey, merchant);
      }
    } else {
      console.log("Cache hit");
    }

    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: "Invalid API key",
      });
    }

    req.merchant = merchant;

    next();
  } catch (err) {
    console.error("Authentication error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      stack: err.stack,
    });
  }
};

module.exports = authMiddleware;
