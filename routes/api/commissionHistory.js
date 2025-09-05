const express = require('express');
const router = express.Router();
const {
  createCommissionHistory,
  getCommissionHistory,
  getCommissionHistoryById,
  getCommissionHistoryByAgent,
  getCommissionHistoryByInvoice,
  getCommissionHistoryByStatus,
  updateCommissionHistory,
  markCommissionAsPaid,
  markCommissionAsUnpaid,
  deleteCommissionHistory,
  getTotalCommissionForAgent,
  getTotalPaidCommissionForAgent,
  getTotalUnpaidCommissionForAgent,
  getCommissionSummaryForAgent,
  getCommissionHistoryByDateRange,
  getCommissionHistoryByPaymentDateRange,
  syncCommissionHistory,
  getUnsyncedCommissionHistory,
  markCommissionHistoryAsSynced
} = require('../../controllers/commissionHistoryController');

// Create commission history record (POST /commission-history)
router.post('/', createCommissionHistory);

// Read all commission history by user (GET /commission-history/:userEmail)
router.get('/:userEmail', getCommissionHistory);

// Read commission history by ID (GET /commission-history/:userEmail/:id)
router.get('/:userEmail/:id', getCommissionHistoryById);

// Get commission history by agent ID (GET /commission-history/:userEmail/agent/:agentId)
router.get('/:userEmail/agent/:agentId', getCommissionHistoryByAgent);

// Get commission history by invoice ID (GET /commission-history/:userEmail/invoice/:invoiceId)
router.get('/:userEmail/invoice/:invoiceId', getCommissionHistoryByInvoice);

// Get commission history by status (GET /commission-history/:userEmail/status/:status)
router.get('/:userEmail/status/:status', getCommissionHistoryByStatus);

// Get total commission for an agent (GET /commission-history/:userEmail/agent/:agentId/total)
router.get('/:userEmail/agent/:agentId/total', getTotalCommissionForAgent);

// Get total paid commission for an agent (GET /commission-history/:userEmail/agent/:agentId/paid)
router.get('/:userEmail/agent/:agentId/paid', getTotalPaidCommissionForAgent);

// Get total unpaid commission for an agent (GET /commission-history/:userEmail/agent/:agentId/unpaid)
router.get('/:userEmail/agent/:agentId/unpaid', getTotalUnpaidCommissionForAgent);

// Get commission summary for an agent (GET /commission-history/:userEmail/agent/:agentId/summary)
router.get('/:userEmail/agent/:agentId/summary', getCommissionSummaryForAgent);

// Get commission history by date range (GET /commission-history/:userEmail/date-range)
router.get('/:userEmail/date-range', getCommissionHistoryByDateRange);

// Get commission history by payment date range (GET /commission-history/:userEmail/payment-date-range)
router.get('/:userEmail/payment-date-range', getCommissionHistoryByPaymentDateRange);

// Get unsynced commission history (GET /commission-history/:userEmail/unsynced)
router.get('/:userEmail/unsynced', getUnsyncedCommissionHistory);

// Update commission history (PUT /commission-history/:id)
router.put('/:id', updateCommissionHistory);

// Mark commission as paid (PUT /commission-history/:id/mark-paid)
router.put('/:id/mark-paid', markCommissionAsPaid);

// Mark commission as unpaid (PUT /commission-history/:id/mark-unpaid)
router.put('/:id/mark-unpaid', markCommissionAsUnpaid);

// Soft delete commission history (DELETE /commission-history/:id)
router.delete('/:id', deleteCommissionHistory);

// Sync commission history (POST /commission-history/sync)
router.post('/sync', syncCommissionHistory);

// Mark commission history as synced (POST /commission-history/mark-synced)
router.post('/mark-synced', markCommissionHistoryAsSynced);

module.exports = router;
