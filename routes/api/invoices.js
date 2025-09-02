const express = require('express');
const router = express.Router();
const {
  syncInvoices
} = require('../../controllers/invoicesController');

// sync invoices (POST /invoices/sync)
router.post('/sync', syncInvoices);

module.exports = router;
