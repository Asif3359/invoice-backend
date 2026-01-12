const { getCashRegistersCollection } = require("../config/database");

/**
 * Sync Cash Registers
 * POST /cash-registers/sync
 * Receives cash registers from client, upserts them, and returns fresh data
 */
const syncCashRegisters = async (req, res) => {
  try {
    const { userEmail, cashRegisters } = req.body;

    // Validation
    if (!userEmail || !Array.isArray(cashRegisters)) {
      return res.status(400).send("Missing userEmail or invalid data");
    }

    const cashRegistersCollection = getCashRegistersCollection();

    // === 🔁 Sync Cash Registers ===
    const cashRegisterOps = cashRegisters.map((register) => {
      const filter = { id: register.id, userEmail };
      const {
        id,
        openingAmount,
        openingTime,
        openedBy,
        closingAmount,
        closingTime,
        closedBy,
        createdAt,
        updatedAt,
        deleted,
      } = register;

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              id,
              openingAmount: openingAmount || 0,
              openingTime: openingTime ? new Date(openingTime) : new Date(),
              openedBy: openedBy || "",
              closingAmount:
                closingAmount !== null && closingAmount !== undefined
                  ? closingAmount
                  : null,
              closingTime: closingTime ? new Date(closingTime) : null,
              closedBy: closedBy || null,
              updatedAt: new Date(updatedAt),
              deleted: deleted || 0,
              userEmail,
              synced: 0,
            },
          },
          $setOnInsert: {
            createdAt: createdAt ? new Date(createdAt) : new Date(),
          },
          upsert: true,
        },
      };
    });

    if (cashRegisterOps.length > 0) {
      await cashRegistersCollection.bulkWrite(cashRegisterOps);
    }

    // === ✅ Return all fresh data
    const freshCashRegisters = await cashRegistersCollection
      .find({ userEmail })
      .project({ userEmail: 0 })
      .toArray();

    res.send({
      success: true,
      cashRegisters: freshCashRegisters,
    });
  } catch (error) {
    console.error("❌ Cash registers sync error:", error);
    res.status(500).send("Error syncing cash registers");
  }
};

module.exports = {
  syncCashRegisters,
};
