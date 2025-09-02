const express = require('express');
const router = express.Router();
const {
  syncPurchases
} = require('../../controllers/purchasesController');

// sync purchases (POST /purchases/sync)
router.post('/sync', syncPurchases);

module.exports = router;
