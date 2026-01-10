const express = require("express");
const router = express.Router();
const { syncInventory } = require("../../controllers/inventoryController");

// sync inventory (POST /inventory/sync)
router.post("/sync", syncInventory);

module.exports = router;
