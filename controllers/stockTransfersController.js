const { getStockTransferHistoryCollection } = require("../config/database");

// sync stock transfers
const syncStockTransfers = async (req, res) => {
  try {
    const { userEmail, stockTransfers } = req.body;

    if (!userEmail || !Array.isArray(stockTransfers)) {
      return res.status(400).send("Missing userEmail or invalid data");
    }

    const stockTransferHistoryCollection = getStockTransferHistoryCollection();

    // === 🔁 Sync Stock Transfers ===
    const transferOps = stockTransfers.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id,
        fromWarehouseId,
        toWarehouseId,
        itemList,
        transferAt,
        note,
        createdAt,
        updatedAt,
        deleted,
      } = item;

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              id,
              fromWarehouseId,
              toWarehouseId,
              itemList,
              transferAt: transferAt ? new Date(transferAt) : new Date(),
              note,
              updatedAt: new Date(updatedAt),
              deleted,
              userEmail,
              synced: 0,
            },
            $setOnInsert: {
              createdAt: createdAt ? new Date(createdAt) : new Date(),
            },
          },
          upsert: true,
        },
      };
    });

    if (transferOps.length > 0) {
      await stockTransferHistoryCollection.bulkWrite(transferOps);
    }

    // === ✅ Return all fresh data
    const freshTransfers = await stockTransferHistoryCollection
      .find({ userEmail })
      .project({ userEmail: 0 })
      .toArray();

    res.send({
      success: true,
      stockTransfers: freshTransfers,
    });
  } catch (error) {
    console.error("❌ Stock transfer sync error:", error);
    res.status(500).send("Error syncing stock transfers");
  }
};

module.exports = {
  syncStockTransfers,
};

