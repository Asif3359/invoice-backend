const { DeliveryNote } = require('../models/DeliveryNote');

// Create delivery note (POST /delivery-notes)
const createDeliveryNote = async (req, res) => {
  try {
    const { userEmail, data } = req.body;
    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");

    const payload = { ...data, userEmail };
    const result = await DeliveryNote.create(payload);
    res.status(201).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error creating delivery note");
  }
};

// Read all delivery notes by user
const getDeliveryNotes = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const notes = await DeliveryNote.findByUserEmail(userEmail);
    res.send(notes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching delivery notes");
  }
};

// Get delivery note by ID
const getDeliveryNoteById = async (req, res) => {
  try {
    const { id, userEmail } = req.params;
    const note = await DeliveryNote.findById(id, userEmail);
    if (!note) return res.status(404).send("Delivery note not found");
    res.send(note);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching delivery note");
  }
};

// Get delivery notes by client ID
const getDeliveryNotesByClient = async (req, res) => {
  try {
    const { clientId, userEmail } = req.params;
    const notes = await DeliveryNote.findByClientId(clientId, userEmail);
    res.send(notes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching delivery notes by client");
  }
};

// Get delivery notes by status
const getDeliveryNotesByStatus = async (req, res) => {
  try {
    const { status, userEmail } = req.params;
    const notes = await DeliveryNote.findByStatus(status, userEmail);
    res.send(notes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching delivery notes by status");
  }
};

// Update delivery note by UUID 'id' field
const updateDeliveryNote = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail, data } = req.body;
    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");

    await DeliveryNote.update(id, userEmail, data);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error updating delivery note");
  }
};

// Soft delete delivery note by UUID 'id'
const deleteDeliveryNote = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).send("Missing userEmail");

    await DeliveryNote.delete(id, userEmail);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error deleting delivery note");
  }
};

// Sync delivery notes and items
const syncDeliveryNotes = async (req, res) => {
  try {
    const { userEmail, deliveryNotes, deliveryNoteItems } = req.body;

    if (!userEmail || !Array.isArray(deliveryNotes) || !Array.isArray(deliveryNoteItems)) {
      return res.status(400).send("Missing userEmail or invalid arrays");
    }

    const fresh = await DeliveryNote.sync(userEmail, deliveryNotes, deliveryNoteItems);
    res.send({ 
      success: true, 
      deliveryNotes: fresh.deliveryNotes, 
      deliveryNoteItems: fresh.deliveryNoteItems 
    });
  } catch (error) {
    console.error("❌ Delivery notes sync error:", error);
    res.status(500).send(error.message || "Error syncing delivery notes");
  }
};

module.exports = {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNoteById,
  getDeliveryNotesByClient,
  getDeliveryNotesByStatus,
  updateDeliveryNote,
  deleteDeliveryNote,
  syncDeliveryNotes
};


