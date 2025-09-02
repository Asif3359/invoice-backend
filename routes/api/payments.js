const express = require('express');
const router = express.Router();
const {
  createPayment,
  updatePayment,
  getPayments,
  deletePayment,
  syncPayments
} = require('../../controllers/paymentsController');

// ✅ 1. Add Payment (POST /payments)
router.post('/', createPayment);

// ✅ 2. Update Payment by ID (PUT /payments/:id)
router.put('/:id', updatePayment);

// ✅ 3. Get All Payments for a User (GET /payments/:userEmail)
router.get('/:userEmail', getPayments);

// ✅ 4. Soft Delete Payment (DELETE /payments/:id)
router.delete('/:id', deletePayment);

// Sync Payments (POST /payments/sync)
router.post('/sync', syncPayments);

module.exports = router;
