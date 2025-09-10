const express = require('express');
const router = express.Router();
const {
  createCreditNote,
  getCreditNotes,
  getCreditNoteById,
  getCreditNotesByClient,
  getCreditNotesByInvoice,
  getCreditNotesByStatus,
  getCreditNoteByNumber,
  getCreditNotesByDateRange,
  getTotalCreditByClient,
  searchCreditNotes,
  updateCreditNote,
  deleteCreditNote,
  syncCreditNotes,
  getUnsyncedCreditNotes,
  markCreditNotesAsSynced
} = require('../../controllers/creditNotesController');

// Create credit note (POST /credit-notes)
router.post('/', createCreditNote);

// Read all credit notes by user (GET /credit-notes/:userEmail)
router.get('/:userEmail', getCreditNotes);

// Get credit note by ID (GET /credit-notes/:userEmail/:id)
router.get('/:userEmail/:id', getCreditNoteById);

// Get credit notes by client ID (GET /credit-notes/client/:userEmail/:clientId)
router.get('/client/:userEmail/:clientId', getCreditNotesByClient);

// Get credit notes by invoice ID (GET /credit-notes/invoice/:userEmail/:invoiceId)
router.get('/invoice/:userEmail/:invoiceId', getCreditNotesByInvoice);

// Get credit notes by status (GET /credit-notes/status/:userEmail/:status)
router.get('/status/:userEmail/:status', getCreditNotesByStatus);

// Get credit note by credit number (GET /credit-notes/number/:userEmail/:creditNo)
router.get('/number/:userEmail/:creditNo', getCreditNoteByNumber);

// Get total credit amount by client (GET /credit-notes/total/:userEmail/:clientId)
router.get('/total/:userEmail/:clientId', getTotalCreditByClient);

// Get unsynced credit notes (GET /credit-notes/unsynced/:userEmail)
router.get('/unsynced/:userEmail', getUnsyncedCreditNotes);

// Get credit notes by date range (GET /credit-notes/date-range?userEmail=...&startDate=...&endDate=...)
router.get('/date-range', getCreditNotesByDateRange);

// Search credit notes (GET /credit-notes/search?userEmail=...&searchTerm=...)
router.get('/search', searchCreditNotes);

// Update credit note by UUID 'id' field (PUT /credit-notes/:id)
router.put('/:id', updateCreditNote);

// Soft delete credit note by UUID 'id' (DELETE /credit-notes/:id)
router.delete('/:id', deleteCreditNote);

// Sync credit notes (POST /credit-notes/sync)
router.post('/sync', syncCreditNotes);

// Mark credit notes as synced (POST /credit-notes/mark-synced)
router.post('/mark-synced', markCreditNotesAsSynced);

module.exports = router;
