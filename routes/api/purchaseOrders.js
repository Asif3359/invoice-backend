const express = require("express");
const router = express.Router();
const {
  syncPurchaseOrders,
} = require("../../controllers/purchaseOrdersController");

// sync purchase orders (POST /purchase-orders/sync)
router.post("/sync", syncPurchaseOrders);

module.exports = router;
