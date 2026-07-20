const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");

const {
  createSettlementController,
} = require("../controllers/settlement.controller");

router.post("/create", authMiddleware, createSettlementController);

module.exports = router;
