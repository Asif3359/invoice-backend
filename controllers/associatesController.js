const { Associate } = require('../models/Associate');

// Create associate (POST /associates)
const createAssociate = async (req, res) => {
  try {
    const { userEmail, data } = req.body;
    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");

    const associateData = { ...data, userEmail };
    const result = await Associate.create(associateData);
    res.status(201).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error creating associate");
  }
};

// Read all associates by user
const getAssociates = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const associates = await Associate.findByUserEmail(userEmail);
    res.send(associates);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching associates");
  }
};

// Update associate by UUID 'id' field
const updateAssociate = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail, data } = req.body;
    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");

    await Associate.update(id, userEmail, data);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error updating associate");
  }
};

// Soft delete associate by UUID 'id'
const deleteAssociate = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).send("Missing userEmail");

    await Associate.delete(id, userEmail);
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message || "Error deleting associate");
  }
};

// Sync associates
const syncAssociates = async (req, res) => {
  try {
    const { userEmail, associates } = req.body;

    if (!userEmail || !Array.isArray(associates)) {
      return res.status(400).send("Missing userEmail or invalid associates array");
    }

    const freshData = await Associate.sync(userEmail, associates);
    res.send({ success: true, data: freshData });

  } catch (error) {
    console.error("❌ Sync error:", error);
    res.status(500).send(error.message || "Error syncing associates");
  }
};

module.exports = {
  createAssociate,
  getAssociates,
  updateAssociate,
  deleteAssociate,
  syncAssociates
};
