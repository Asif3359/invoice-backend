const express = require('express');
const router = express.Router();
const {
  createCommissionAgent,
  getCommissionAgents,
  getCommissionAgentById,
  searchCommissionAgents,
  updateCommissionAgent,
  updateCommissionAmount,
  deleteCommissionAgent,
  getTotalCommission,
  syncCommissionAgents,
  getUnsyncedCommissionAgents,
  markCommissionAgentsAsSynced
} = require('../../controllers/commissionAgentsController');

// Create commission agent (POST /commission-agents)
router.post('/', createCommissionAgent);

// Read all commission agents by user (GET /commission-agents/:userEmail)
router.get('/:userEmail', getCommissionAgents);

// Read commission agent by ID (GET /commission-agents/:userEmail/:id)
router.get('/:userEmail/:id', getCommissionAgentById);

// Search commission agents by name (GET /commission-agents/:userEmail/search/:name)
router.get('/:userEmail/search/:name', searchCommissionAgents);

// Get total commission for an agent (GET /commission-agents/:userEmail/:id/total-commission)
router.get('/:userEmail/:id/total-commission', getTotalCommission);

// Get unsynced commission agents (GET /commission-agents/:userEmail/unsynced)
router.get('/:userEmail/unsynced', getUnsyncedCommissionAgents);

// Update commission agent by UUID 'id' field (PUT /commission-agents/:id)
router.put('/:id', updateCommissionAgent);

// Update commission amount specifically (PUT /commission-agents/:id/commission-amount)
router.put('/:id/commission-amount', updateCommissionAmount);

// Soft delete commission agent by UUID 'id' (DELETE /commission-agents/:id)
router.delete('/:id', deleteCommissionAgent);

// Sync commission agents (POST /commission-agents/sync)
router.post('/sync', syncCommissionAgents);

// Mark commission agents as synced (POST /commission-agents/mark-synced)
router.post('/mark-synced', markCommissionAgentsAsSynced);

module.exports = router;
