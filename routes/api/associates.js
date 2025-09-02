const express = require('express');
const router = express.Router();
const {
  createAssociate,
  getAssociates,
  updateAssociate,
  deleteAssociate,
  syncAssociates
} = require('../../controllers/associatesController');

// Create associate (POST /associates)
router.post('/', createAssociate);

// Read all associates by user (GET /associates/:userEmail)
router.get('/:userEmail', getAssociates);

// Update associate by UUID 'id' field (PUT /associates/:id)
router.put('/:id', updateAssociate);

// Soft delete associate by UUID 'id' (DELETE /associates/:id)
router.delete('/:id', deleteAssociate);

// Sync associates (POST /associates/sync)
router.post('/sync', syncAssociates);

module.exports = router;
