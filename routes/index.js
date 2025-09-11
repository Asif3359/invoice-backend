const express = require('express');
const router = express.Router();

// API Routes
const associatesRouter = require('./api/associates');
const productsRouter = require('./api/products');
const paymentsRouter = require('./api/payments');
const invoicesRouter = require('./api/invoices');
const purchasesRouter = require('./api/purchases');
const commissionAgentsRouter = require('./api/commissionAgents');
const commissionHistoryRouter = require('./api/commissionHistory');
const expensesRouter = require('./api/expenses');
const creditNotesRouter = require('./api/creditNotes');
const deliveryNotesRouter = require('./api/deliveryNotes');

// Basic routes
router.get('/', (req, res) => {
  res.send({
    message: '🌍 Invoice App Backend is running',
    status: 'success'
  });
});

router.get('/test', (req, res) => {
  res.send('testing 🌍');
});

// API routes
router.use('/associates', associatesRouter);
router.use('/products', productsRouter);
router.use('/payments', paymentsRouter);
router.use('/invoices', invoicesRouter);
router.use('/purchases', purchasesRouter);
router.use('/commission-agents', commissionAgentsRouter);
router.use('/commission-history', commissionHistoryRouter);
router.use('/expenses', expensesRouter);
router.use('/credit-notes', creditNotesRouter);
router.use('/delivery-notes', deliveryNotesRouter);
module.exports = router;
