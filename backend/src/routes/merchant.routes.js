const express = require("express");
const router = express.Router();
const merchant  = require("../controllers/merchant.controller");

router.post("/create", merchant.createMerchant);
module.exports = router