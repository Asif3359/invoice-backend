const {
  getWarehousesCollection,
  getWarehouseItemsCollection,
} = require("../config/database");

// sync warehouses
const syncWarehouses = async (req, res) => {
  try {
    const { userEmail, warehouses, warehouseItems } = req.body;

    if (
      !userEmail ||
      !Array.isArray(warehouses) ||
      !Array.isArray(warehouseItems)
    ) {
      return res.status(400).send("Missing userEmail or invalid data");
    }

    const warehousesCollection = getWarehousesCollection();
    const warehouseItemsCollection = getWarehouseItemsCollection();

    // === 🔁 Sync Warehouses ===
    const warehouseOps = warehouses.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id,
        name,
        location,
        description,
        quantity,
        customFields,
        code,
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
              name,
              location,
              description,
              quantity,
              customFields,
              code,
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

    if (warehouseOps.length > 0) {
      await warehousesCollection.bulkWrite(warehouseOps);
    }

    // === 🔁 Sync Warehouse Items ===
    const itemOps = warehouseItems.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id,
        warehouseId,
        productId,
        quantity,
        location,
        barcode,
        notes,
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
              warehouseId,
              productId,
              quantity,
              location,
              barcode,
              notes,
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

    if (itemOps.length > 0) {
      await warehouseItemsCollection.bulkWrite(itemOps);
    }

    // === ✅ Return all fresh data
    const [freshWarehouses, freshItems] = await Promise.all([
      warehousesCollection
        .find({ userEmail })
        .project({ userEmail: 0 })
        .toArray(),
      warehouseItemsCollection
        .find({ userEmail })
        .project({ userEmail: 0 })
        .toArray(),
    ]);

    res.send({
      success: true,
      warehouses: freshWarehouses,
      warehouseItems: freshItems,
    });
  } catch (error) {
    console.error("❌ Warehouse sync error:", error);
    res.status(500).send("Error syncing warehouses");
  }
};

module.exports = {
  syncWarehouses,
};

