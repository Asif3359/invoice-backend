const express = require("express");
const router = express.Router();
const {
  syncStockTransfers,
} = require("../../controllers/stockTransfersController");

// sync stock transfers (POST /stock-transfers/sync)
router.post("/sync", syncStockTransfers);

module.exports = router;

