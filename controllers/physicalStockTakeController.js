const { getPhysicalStockTakeCollection } = require("../config/database");

// sync physical stock take
const syncPhysicalStockTake = async (req, res) => {
  try {
    const { userEmail, physicalStockTakes } = req.body;

    if (!userEmail || !Array.isArray(physicalStockTakes)) {
      return res.status(400).send("Missing userEmail or invalid data");
    }

    const physicalStockTakeCollection = getPhysicalStockTakeCollection();

    // === 🔁 Sync Physical Stock Take ===
    const stockTakeOps = physicalStockTakes.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id,
        date,
        productId,
        countedStock,
        expectedStock,
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
              date,
              productId,
              countedStock,
              expectedStock,
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

    if (stockTakeOps.length > 0) {
      await physicalStockTakeCollection.bulkWrite(stockTakeOps);
    }

    // === ✅ Return all fresh data
    const freshStockTakes = await physicalStockTakeCollection
      .find({ userEmail })
      .project({ userEmail: 0 })
      .toArray();

    res.send({
      success: true,
      physicalStockTakes: freshStockTakes,
    });
  } catch (error) {
    console.error("❌ Physical stock take sync error:", error);
    res.status(500).send("Error syncing physical stock take");
  }
};

module.exports = {
  syncPhysicalStockTake,
};

