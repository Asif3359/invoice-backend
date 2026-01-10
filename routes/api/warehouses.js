const express = require("express");
const router = express.Router();
const { syncWarehouses } = require("../../controllers/warehousesController");

// sync warehouses (POST /warehouses/sync)
router.post("/sync", syncWarehouses);

module.exports = router;
