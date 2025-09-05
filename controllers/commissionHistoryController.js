const { CommissionHistory } = require('../models/CommissionHistory');

// Create commission history record (POST /commission-history)
const createCommissionHistory = async (req, res) => {
  try {
    const { userEmail, data } = req.body;
    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");

    const historyData = { ...data, userEmail };
    const result = await CommissionHistory.create(historyData);
    res.status(201).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error creating commission history");
  }
};

// Read all commission history by user (GET /commission-history/:userEmail)
const getCommissionHistory = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const history = await CommissionHistory.findByUserEmail(userEmail);
    res.send(history);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching commission history");
  }
};

// Read commission history by ID (GET /commission-history/:userEmail/:id)
const getCommissionHistoryById = async (req, res) => {
  try {
    const { userEmail, id } = req.params;
    const record = await CommissionHistory.findById(id, userEmail);
    if (!record) return res.status(404).send("Commission history not found");
    res.send(record);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching commission history");
  }
};

// Get commission history by agent ID (GET /commission-history/:userEmail/agent/:agentId)
const getCommissionHistoryByAgent = async (req, res) => {
  try {
    const { userEmail, agentId } = req.params;
    const history = await CommissionHistory.findByAgentId(agentId, userEmail);
    res.send(history);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching commission history for agent");
  }
};

// Get commission history by invoice ID (GET /commission-history/:userEmail/invoice/:invoiceId)
const getCommissionHistoryByInvoice = async (req, res) => {
  try {
    const { userEmail, invoiceId } = req.params;
    const history = await CommissionHistory.findByInvoiceId(invoiceId, userEmail);
    res.send(history);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching commission history for invoice");
  }
};

// Get commission history by status (GET /commission-history/:userEmail/status/:status)
const getCommissionHistoryByStatus = async (req, res) => {
  try {
    const { userEmail, status } = req.params;
    if (!['paid', 'unpaid'].includes(status)) {
      return res.status(400).send("Invalid status. Must be 'paid' or 'unpaid'");
    }
    const history = await CommissionHistory.findByStatus(status, userEmail);
    res.send(history);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching commission history by status");
  }
};

// Update commission history (PUT /commission-history/:id)
const updateCommissionHistory = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail, data } = req.body;
    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");

    await CommissionHistory.update(id, userEmail, data);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error updating commission history");
  }
};

// Mark commission as paid (PUT /commission-history/:id/mark-paid)
const markCommissionAsPaid = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail, paymentDate, paymentMethod, notes } = req.body;
    if (!userEmail) return res.status(400).send("Missing userEmail");

    await CommissionHistory.markAsPaid(id, userEmail, paymentDate, paymentMethod, notes);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error marking commission as paid");
  }
};

// Mark commission as unpaid (PUT /commission-history/:id/mark-unpaid)
const markCommissionAsUnpaid = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).send("Missing userEmail");

    await CommissionHistory.markAsUnpaid(id, userEmail);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error marking commission as unpaid");
  }
};

// Soft delete commission history (DELETE /commission-history/:id)
const deleteCommissionHistory = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).send("Missing userEmail");

    await CommissionHistory.delete(id, userEmail);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error deleting commission history");
  }
};

// Get total commission for an agent (GET /commission-history/:userEmail/agent/:agentId/total)
const getTotalCommissionForAgent = async (req, res) => {
  try {
    const { userEmail, agentId } = req.params;
    const totalCommission = await CommissionHistory.getTotalForAgent(agentId, userEmail);
    res.send({ totalCommission });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching total commission for agent");
  }
};

// Get total paid commission for an agent (GET /commission-history/:userEmail/agent/:agentId/paid)
const getTotalPaidCommissionForAgent = async (req, res) => {
  try {
    const { userEmail, agentId } = req.params;
    const totalPaid = await CommissionHistory.getTotalPaidForAgent(agentId, userEmail);
    res.send({ totalPaid });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching total paid commission for agent");
  }
};

// Get total unpaid commission for an agent (GET /commission-history/:userEmail/agent/:agentId/unpaid)
const getTotalUnpaidCommissionForAgent = async (req, res) => {
  try {
    const { userEmail, agentId } = req.params;
    const totalUnpaid = await CommissionHistory.getTotalUnpaidForAgent(agentId, userEmail);
    res.send({ totalUnpaid });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching total unpaid commission for agent");
  }
};

// Get commission summary for an agent (GET /commission-history/:userEmail/agent/:agentId/summary)
const getCommissionSummaryForAgent = async (req, res) => {
  try {
    const { userEmail, agentId } = req.params;
    const [total, paid, unpaid] = await Promise.all([
      CommissionHistory.getTotalForAgent(agentId, userEmail),
      CommissionHistory.getTotalPaidForAgent(agentId, userEmail),
      CommissionHistory.getTotalUnpaidForAgent(agentId, userEmail)
    ]);
    
    res.send({
      totalCommission: total,
      totalPaid: paid,
      totalUnpaid: unpaid
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching commission summary for agent");
  }
};

// Get commission history by date range (GET /commission-history/:userEmail/date-range)
const getCommissionHistoryByDateRange = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).send("Missing startDate or endDate query parameters");
    }

    const history = await CommissionHistory.findByDateRange(userEmail, startDate, endDate);
    res.send(history);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching commission history by date range");
  }
};

// Get commission history by payment date range (GET /commission-history/:userEmail/payment-date-range)
const getCommissionHistoryByPaymentDateRange = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).send("Missing startDate or endDate query parameters");
    }

    const history = await CommissionHistory.findByPaymentDateRange(userEmail, startDate, endDate);
    res.send(history);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching commission history by payment date range");
  }
};

// Sync commission history (POST /commission-history/sync)
const syncCommissionHistory = async (req, res) => {
  try {
    const { userEmail, commissionHistory } = req.body;

    if (!userEmail || !Array.isArray(commissionHistory)) {
      return res.status(400).send("Missing userEmail or invalid commissionHistory array");
    }

    const freshData = await CommissionHistory.sync(userEmail, commissionHistory);
    res.send({ success: true, data: freshData });

  } catch (error) {
    console.error("❌ Commission history sync error:", error);
    res.status(500).send(error.message || "Error syncing commission history");
  }
};

// Get unsynced commission history (GET /commission-history/:userEmail/unsynced)
const getUnsyncedCommissionHistory = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const unsyncedHistory = await CommissionHistory.getUnsynced(userEmail);
    res.send(unsyncedHistory);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching unsynced commission history");
  }
};

// Mark commission history as synced (POST /commission-history/mark-synced)
const markCommissionHistoryAsSynced = async (req, res) => {
  try {
    const { userEmail, ids } = req.body;
    if (!userEmail || !Array.isArray(ids)) {
      return res.status(400).send("Missing userEmail or invalid ids array");
    }

    await CommissionHistory.markAsSynced(ids, userEmail);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error marking commission history as synced");
  }
};

module.exports = {
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
};
