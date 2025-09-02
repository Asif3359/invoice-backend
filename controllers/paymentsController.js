const { getPaymentsCollection } = require('../config/database');

// ✅ 1. Add Payment (POST /payments)
const createPayment = async (req, res) => {
  try {
    const { userEmail, data } = req.body;
    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");
    if (!data.id) return res.status(400).send("Missing id field in data");

    const payment = {
      ...data,
      userEmail,
      synced: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: 0
    };

    const collection = getPaymentsCollection();
    const result = await collection.insertOne(payment);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).send("Error creating payment");
  }
};

// ✅ 2. Update Payment by ID (PUT /payments/:id)
const updatePayment = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail, data } = req.body;

    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");

    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0
    };

    const collection = getPaymentsCollection();
    const result = await collection.updateOne(
      { id: id, userEmail },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) return res.status(404).send("Payment not found or no permission");
    res.send({ success: true });
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).send("Error updating payment");
  }
};

// ✅ 3. Get All Payments for a User (GET /payments/:userEmail)
const getPayments = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const collection = getPaymentsCollection();
    const payments = await collection.find({ userEmail, deleted: 0 }).toArray();
    res.send(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).send("Error fetching payments");
  }
};

// ✅ 4. Soft Delete Payment (DELETE /payments/:id)
const deletePayment = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail } = req.body;

    if (!userEmail) return res.status(400).send("Missing userEmail");

    const collection = getPaymentsCollection();
    const result = await collection.updateOne(
      { id: id, userEmail },
      {
        $set: {
          deleted: 1,
          updatedAt: new Date(),
          synced: 0
        }
      }
    );

    if (result.matchedCount === 0) return res.status(404).send("Payment not found or no permission");
    res.send({ success: true });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).send("Error deleting payment");
  }
};

// Sync Payments (POST /payments/sync)
const syncPayments = async (req, res) => {
  try {
    const { userEmail, payments } = req.body;
    if (!userEmail || !Array.isArray(payments)) {
      return res.status(400).send("Missing userEmail or invalid payments array");
    }

    const collection = getPaymentsCollection();
    const bulkOps = payments.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id,
        invoiceId,
        amount,
        method,
        date,
        note,
        advance,
        createdAt,
        updatedAt = new Date(),
        deleted
      } = item;

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              id,
              invoiceId,
              amount,
              method,
              date,
              note,
              advance,
              updatedAt: new Date(updatedAt),
              deleted,
              userEmail,
              synced: 0
            },
            $setOnInsert: {
              createdAt: createdAt ? new Date(createdAt) : new Date()
            }
          },
          upsert: true
        }
      };
    });

    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
    }

    const freshData = await collection
      .find({ userEmail })
      .project({ userEmail: 0 }) // Optional
      .toArray();

    res.send({ success: true, data: freshData });

  } catch (error) {
    console.error("❌ Payment sync error:", error);
    res.status(500).send("Error syncing payments");
  }
};

module.exports = {
  createPayment,
  updatePayment,
  getPayments,
  deletePayment,
  syncPayments
};
