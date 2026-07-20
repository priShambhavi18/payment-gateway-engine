const merchant = require("../services/merchant.service");

async function createMerchant(req, res, next) {
  try {
    const createdMerchant= await merchant.createMerchantService(req.body);
    res.status(201).json(createdMerchant);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createMerchant
};
