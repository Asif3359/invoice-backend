const { CreditNote } = require('../models/CreditNote');

// Create credit note (POST /credit-notes)
const createCreditNote = async (req, res) => {
  try {
    const { userEmail, data } = req.body;
    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");

    const creditNoteData = { ...data, userEmail };
    const result = await CreditNote.create(creditNoteData);
    res.status(201).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error creating credit note");
  }
};

// Read all credit notes by user
const getCreditNotes = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const creditNotes = await CreditNote.findByUserEmail(userEmail);
    res.send(creditNotes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching credit notes");
  }
};

// Get credit note by ID
const getCreditNoteById = async (req, res) => {
  try {
    const { id, userEmail } = req.params;
    const creditNote = await CreditNote.findById(id, userEmail);
    if (!creditNote) return res.status(404).send("Credit note not found");
    res.send(creditNote);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching credit note");
  }
};

// Get credit notes by client ID
const getCreditNotesByClient = async (req, res) => {
  try {
    const { clientId, userEmail } = req.params;
    const creditNotes = await CreditNote.findByClientId(clientId, userEmail);
    res.send(creditNotes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching credit notes by client");
  }
};

// Get credit notes by invoice ID
const getCreditNotesByInvoice = async (req, res) => {
  try {
    const { invoiceId, userEmail } = req.params;
    const creditNotes = await CreditNote.findByInvoiceId(invoiceId, userEmail);
    res.send(creditNotes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching credit notes by invoice");
  }
};

// Get credit notes by status
const getCreditNotesByStatus = async (req, res) => {
  try {
    const { status, userEmail } = req.params;
    const creditNotes = await CreditNote.findByStatus(status, userEmail);
    res.send(creditNotes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching credit notes by status");
  }
};

// Get credit note by credit number
const getCreditNoteByNumber = async (req, res) => {
  try {
    const { creditNo, userEmail } = req.params;
    const creditNote = await CreditNote.findByCreditNo(creditNo, userEmail);
    if (!creditNote) return res.status(404).send("Credit note not found");
    res.send(creditNote);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching credit note by number");
  }
};

// Get credit notes by date range
const getCreditNotesByDateRange = async (req, res) => {
  try {
    const { userEmail, startDate, endDate } = req.query;
    if (!userEmail || !startDate || !endDate) {
      return res.status(400).send("Missing userEmail, startDate, or endDate");
    }
    
    const creditNotes = await CreditNote.findByDateRange(userEmail, startDate, endDate);
    res.send(creditNotes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching credit notes by date range");
  }
};

// Get total credit amount by client
const getTotalCreditByClient = async (req, res) => {
  try {
    const { clientId, userEmail } = req.params;
    const result = await CreditNote.getTotalCreditByClient(clientId, userEmail);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching total credit by client");
  }
};

// Search credit notes
const searchCreditNotes = async (req, res) => {
  try {
    const { userEmail, searchTerm } = req.query;
    if (!userEmail || !searchTerm) {
      return res.status(400).send("Missing userEmail or searchTerm");
    }
    
    const creditNotes = await CreditNote.search(userEmail, searchTerm);
    res.send(creditNotes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error searching credit notes");
  }
};

// Update credit note by UUID 'id' field
const updateCreditNote = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail, data } = req.body;
    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");

    await CreditNote.update(id, userEmail, data);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error updating credit note");
  }
};

// Soft delete credit note by UUID 'id'
const deleteCreditNote = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).send("Missing userEmail");

    await CreditNote.delete(id, userEmail);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error deleting credit note");
  }
};

// Sync credit notes
const syncCreditNotes = async (req, res) => {
  try {
    const { userEmail, creditNotes } = req.body;

    if (!userEmail || !Array.isArray(creditNotes)) {
      return res.status(400).send("Missing userEmail or invalid creditNotes array");
    }

    const freshData = await CreditNote.sync(userEmail, creditNotes);
    res.send({ success: true, data: freshData });

  } catch (error) {
    console.error("❌ Credit notes sync error:", error);
    res.status(500).send(error.message || "Error syncing credit notes");
  }
};

// Get unsynced credit notes
const getUnsyncedCreditNotes = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const creditNotes = await CreditNote.getUnsynced(userEmail);
    res.send(creditNotes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching unsynced credit notes");
  }
};

// Mark credit notes as synced
const markCreditNotesAsSynced = async (req, res) => {
  try {
    const { userEmail, ids } = req.body;
    if (!userEmail || !Array.isArray(ids)) {
      return res.status(400).send("Missing userEmail or invalid ids array");
    }

    await CreditNote.markAsSynced(ids, userEmail);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error marking credit notes as synced");
  }
};

module.exports = {
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
};
