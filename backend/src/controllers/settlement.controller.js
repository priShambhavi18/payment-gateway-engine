const {
  createSettlementForMerchant,
} = require("../services/settlement.service");

async function createSettlementController(req, res) {
  try {
    const merchant = req.merchant;

    const settlement = await createSettlementForMerchant(merchant.id);

    return res.status(200).json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  createSettlementController,
};
