const express = require("express");
const router = express.Router();
const { syncCashRegisters } = require("../../controllers/cashRegistersController");

// Sync cash registers (POST /cash-registers/sync)
router.post("/sync", syncCashRegisters);

module.exports = router;
