const { randomUUID } = require("crypto");
const {
  insertMerchant,
  getMerchantByApiKey,
  getAllMerchants
} = require("../repositories/merchant.repository");
const { createMerchantAccount } = require("../repositories/account.repository");

async function createMerchantService(data) {
  const merchant = {
    id: randomUUID(),
    name: data.name,
    apiKey: randomUUID(),
    email: data.email,
  };

  await insertMerchant(merchant);
  await createMerchantAccount(merchant.id);
  return merchant;
}

async function getMerchantByApiKeyService(apiKey) {
  return await getMerchantByApiKey(apiKey);
}

async function getAllMerchantsService() {
  return await getAllMerchants();
}

module.exports = {
  createMerchantService,
  getMerchantByApiKeyService,
  getAllMerchantsService
};
