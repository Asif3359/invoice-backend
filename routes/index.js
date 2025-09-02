const express = require('express');
const router = express.Router();

// API Routes
const associatesRouter = require('./api/associates');
const productsRouter = require('./api/products');
const paymentsRouter = require('./api/payments');
const invoicesRouter = require('./api/invoices');
const purchasesRouter = require('./api/purchases');

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

module.exports = router;
