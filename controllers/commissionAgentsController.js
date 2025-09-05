const { CommissionAgent } = require('../models/CommissionAgent');

// Create commission agent (POST /commission-agents)
const createCommissionAgent = async (req, res) => {
  try {
    const { userEmail, data } = req.body;
    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");

    const agentData = { ...data, userEmail };
    const result = await CommissionAgent.create(agentData);
    res.status(201).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error creating commission agent");
  }
};

// Read all commission agents by user (GET /commission-agents/:userEmail)
const getCommissionAgents = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const agents = await CommissionAgent.findByUserEmail(userEmail);
    res.send(agents);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching commission agents");
  }
};

// Read commission agent by ID (GET /commission-agents/:userEmail/:id)
const getCommissionAgentById = async (req, res) => {
  try {
    const { userEmail, id } = req.params;
    const agent = await CommissionAgent.findById(id, userEmail);
    if (!agent) return res.status(404).send("Commission agent not found");
    res.send(agent);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching commission agent");
  }
};

// Search commission agents by name (GET /commission-agents/:userEmail/search/:name)
const searchCommissionAgents = async (req, res) => {
  try {
    const { userEmail, name } = req.params;
    const agents = await CommissionAgent.findByName(name, userEmail);
    res.send(agents);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error searching commission agents");
  }
};

// Update commission agent by UUID 'id' field (PUT /commission-agents/:id)
const updateCommissionAgent = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail, data } = req.body;
    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");

    await CommissionAgent.update(id, userEmail, data);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error updating commission agent");
  }
};

// Update commission amount specifically (PUT /commission-agents/:id/commission-amount)
const updateCommissionAmount = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail, commissionAmount } = req.body;
    if (!userEmail || commissionAmount === undefined) {
      return res.status(400).send("Missing userEmail or commissionAmount");
    }

    await CommissionAgent.updateCommissionAmount(id, userEmail, commissionAmount);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error updating commission amount");
  }
};

// Soft delete commission agent by UUID 'id' (DELETE /commission-agents/:id)
const deleteCommissionAgent = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).send("Missing userEmail");

    await CommissionAgent.delete(id, userEmail);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error deleting commission agent");
  }
};

// Get total commission for an agent (GET /commission-agents/:userEmail/:id/total-commission)
const getTotalCommission = async (req, res) => {
  try {
    const { userEmail, id } = req.params;
    const totalCommission = await CommissionAgent.getTotalCommission(id, userEmail);
    res.send({ totalCommission });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching total commission");
  }
};

// Sync commission agents (POST /commission-agents/sync)
const syncCommissionAgents = async (req, res) => {
  try {
    const { userEmail, commissionAgents } = req.body;

    if (!userEmail || !Array.isArray(commissionAgents)) {
      return res.status(400).send("Missing userEmail or invalid commissionAgents array");
    }

    const freshData = await CommissionAgent.sync(userEmail, commissionAgents);
    res.send({ success: true, data: freshData });

  } catch (error) {
    console.error("❌ Commission agents sync error:", error);
    res.status(500).send(error.message || "Error syncing commission agents");
  }
};

// Get unsynced commission agents (GET /commission-agents/:userEmail/unsynced)
const getUnsyncedCommissionAgents = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const unsyncedAgents = await CommissionAgent.getUnsynced(userEmail);
    res.send(unsyncedAgents);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching unsynced commission agents");
  }
};

// Mark commission agents as synced (POST /commission-agents/mark-synced)
const markCommissionAgentsAsSynced = async (req, res) => {
  try {
    const { userEmail, ids } = req.body;
    if (!userEmail || !Array.isArray(ids)) {
      return res.status(400).send("Missing userEmail or invalid ids array");
    }

    await CommissionAgent.markAsSynced(ids, userEmail);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error marking commission agents as synced");
  }
};

module.exports = {
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
};
