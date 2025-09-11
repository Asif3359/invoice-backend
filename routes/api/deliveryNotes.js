const express = require('express');
const router = express.Router();
const {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNoteById,
  getDeliveryNotesByClient,
  getDeliveryNotesByStatus,
  updateDeliveryNote,
  deleteDeliveryNote,
  syncDeliveryNotes
} = require('../../controllers/deliveryNotesController');

// Create delivery note (POST /delivery-notes)
router.post('/', createDeliveryNote);

// Read all delivery notes by user (GET /delivery-notes/:userEmail)
router.get('/:userEmail', getDeliveryNotes);

// Get delivery note by ID (GET /delivery-notes/:userEmail/:id)
router.get('/:userEmail/:id', getDeliveryNoteById);

// Get delivery notes by client ID (GET /delivery-notes/client/:userEmail/:clientId)
router.get('/client/:userEmail/:clientId', getDeliveryNotesByClient);

// Get delivery notes by status (GET /delivery-notes/status/:userEmail/:status)
router.get('/status/:userEmail/:status', getDeliveryNotesByStatus);

// Update delivery note by UUID 'id' field (PUT /delivery-notes/:id)
router.put('/:id', updateDeliveryNote);

// Soft delete delivery note by UUID 'id' (DELETE /delivery-notes/:id)
router.delete('/:id', deleteDeliveryNote);

// Sync delivery notes (POST /delivery-notes/sync)
router.post('/sync', syncDeliveryNotes);

module.exports = router;


