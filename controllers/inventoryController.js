const { getInventoryCollection } = require("../config/database");

// sync inventory
const syncInventory = async (req, res) => {
  try {
    const { userEmail, inventory } = req.body;

    if (!userEmail || !Array.isArray(inventory)) {
      return res.status(400).send("Missing userEmail or invalid data");
    }

    const inventoryCollection = getInventoryCollection();

    // === 🔁 Sync Inventory ===
    const inventoryOps = inventory.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id,
        productId,
        warehouseId,
        closingStock,
        closingStockRate,
        inventoryMode,
        inventoryComment,
        isTransfer,
        stockTransferId,
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
              productId,
              warehouseId,
              closingStock,
              closingStockRate,
              inventoryMode,
              inventoryComment,
              isTransfer,
              stockTransferId,
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

    if (inventoryOps.length > 0) {
      await inventoryCollection.bulkWrite(inventoryOps);
    }

    // === ✅ Return all fresh data
    const freshInventory = await inventoryCollection
      .find({ userEmail })
      .project({ userEmail: 0 })
      .toArray();

    res.send({
      success: true,
      inventory: freshInventory,
    });
  } catch (error) {
    console.error("❌ Inventory sync error:", error);
    res.status(500).send("Error syncing inventory");
  }
};

module.exports = {
  syncInventory,
};

