const express = require("express");
const router = express.Router();
const {
  syncPhysicalStockTake,
} = require("../../controllers/physicalStockTakeController");

// sync physical stock take (POST /physical-stock-take/sync)
router.post("/sync", syncPhysicalStockTake);

module.exports = router;

