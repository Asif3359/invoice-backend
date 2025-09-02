const express = require('express');
const router = express.Router();
const {
  createProduct,
  updateProduct,
  getProducts,
  deleteProduct,
  syncProducts
} = require('../../controllers/productsController');

// ✅ Add Product (POST /products)
router.post('/', createProduct);

// ✅ Update Product by UUID (PUT /products/:id)
router.put('/:id', updateProduct);

// ✅ Get All Products for a User (GET /products/:userEmail)
router.get('/:userEmail', getProducts);

// ✅ Soft Delete Product (DELETE /products/:id)
router.delete('/:id', deleteProduct);

// sync products (POST /products/sync)
router.post('/sync', syncProducts);

module.exports = router;
