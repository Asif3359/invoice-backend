const express = require('express');
const router = express.Router();
const {
  createExpense,
  updateExpense,
  getExpenses,
  getExpenseById,
  deleteExpense,
  getExpensesByDateRange,
  getExpensesByCategory,
  getExpensesByType,
  searchExpenses,
  getFilteredExpenses,
  getExpenseSummary,
  getExpenseCategories,
  getExpenseTypes,
  getExpensesByMonth,
  getExpensesByYear,
  getRecentExpenses,
  syncExpenses
} = require('../../controllers/expensesController');

// ✅ Core CRUD Operations

// Add Expense (POST /expenses)
router.post('/', createExpense);

// Update Expense by UUID (PUT /expenses/:id)
router.put('/:id', updateExpense);

// Get All Expenses for a User (GET /expenses/:userEmail)
router.get('/:userEmail', getExpenses);

// Get Expense by ID (GET /expenses/:userEmail/:id)
router.get('/:userEmail/:id', getExpenseById);

// Soft Delete Expense (DELETE /expenses/:id)
router.delete('/:id', deleteExpense);

// ✅ Advanced Query Routes

// Get Expenses by Date Range (GET /expenses/:userEmail/date-range?startDate=&endDate=)
router.get('/:userEmail/date-range', getExpensesByDateRange);

// Get Expenses by Category (GET /expenses/:userEmail/category/:category)
router.get('/:userEmail/category/:category', getExpensesByCategory);

// Get Expenses by Type (GET /expenses/:userEmail/type/:type)
router.get('/:userEmail/type/:type', getExpensesByType);

// Search Expenses (GET /expenses/:userEmail/search?q=searchTerm)
router.get('/:userEmail/search', searchExpenses);

// Get Filtered Expenses (POST /expenses/:userEmail/filter)
router.post('/:userEmail/filter', getFilteredExpenses);

// ✅ Analytics & Reporting Routes

// Get Expense Summary (GET /expenses/:userEmail/summary?startDate=&endDate=)
router.get('/:userEmail/summary', getExpenseSummary);

// Get Unique Categories (GET /expenses/:userEmail/categories)
router.get('/:userEmail/categories', getExpenseCategories);

// Get Unique Expense Types (GET /expenses/:userEmail/types)
router.get('/:userEmail/types', getExpenseTypes);

// Get Expenses by Month (GET /expenses/:userEmail/month/:year/:month)
router.get('/:userEmail/month/:year/:month', getExpensesByMonth);

// Get Expenses by Year (GET /expenses/:userEmail/year/:year)
router.get('/:userEmail/year/:year', getExpensesByYear);

// Get Recent Expenses (GET /expenses/:userEmail/recent?days=30)
router.get('/:userEmail/recent', getRecentExpenses);

// ✅ Sync Route

// Sync Expenses (POST /expenses/sync)
router.post('/sync', syncExpenses);

module.exports = router;
