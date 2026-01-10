const {
  getWarehousesCollection,
  getWarehouseItemsCollection,
} = require("../config/database");

// Warehouse Schema
const warehouseSchema = {
  id: { type: String, required: true },
  userEmail: { type: String, required: true },
  name: { type: String, required: true },
  location: { type: String, default: "" },
  description: { type: String, default: "" },
  quantity: { type: Number, default: 0 },
  customFields: { type: String, default: "" },
  code: { type: String, default: "" },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};

// Warehouse Item Schema
const warehouseItemSchema = {
  id: { type: String, required: true },
  userEmail: { type: String, required: true },
  warehouseId: { type: String, required: true },
  productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  location: { type: String, default: "" },
  barcode: { type: String, default: "" },
  notes: { type: String, default: "" },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};

// Validation function
const validateWarehouse = (data) => {
  const errors = [];

  if (!data.id) errors.push("id is required");
  if (!data.userEmail) errors.push("userEmail is required");
  if (!data.name) errors.push("name is required");

  return errors;
};

class Warehouse {
  // Find all warehouses by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;

    return await getWarehousesCollection().find(filter).toArray();
  }

  // Find warehouse by ID and user email
  static async findById(id, userEmail) {
    return await getWarehousesCollection().findOne({
      id,
      userEmail,
      deleted: 0,
    });
  }

  // Sync warehouses
  static async sync(userEmail, warehouses, warehouseItems) {
    if (!Array.isArray(warehouses) || !Array.isArray(warehouseItems)) {
      throw new Error("warehouses and warehouseItems must be arrays");
    }

    // Sync warehouses
    const warehouseOps = warehouses.map((item) => {
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
          filter: { id, userEmail },
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
      await getWarehousesCollection().bulkWrite(warehouseOps);
    }

    // Sync warehouse items
    const itemOps = warehouseItems.map((item) => {
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
          filter: { id, userEmail },
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
      await getWarehouseItemsCollection().bulkWrite(itemOps);
    }

    // Return fresh data
    const [freshWarehouses, freshItems] = await Promise.all([
      this.findByUserEmail(userEmail),
      WarehouseItem.findByUserEmail(userEmail),
    ]);

    return {
      warehouses: freshWarehouses,
      warehouseItems: freshItems,
    };
  }
}

class WarehouseItem {
  // Find all items by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;

    return await getWarehouseItemsCollection().find(filter).toArray();
  }

  // Find items by warehouse ID
  static async findByWarehouseId(warehouseId, userEmail) {
    return await getWarehouseItemsCollection()
      .find({
        warehouseId,
        userEmail,
        deleted: 0,
      })
      .toArray();
  }
}

module.exports = {
  Warehouse,
  WarehouseItem,
  warehouseSchema,
  warehouseItemSchema,
  validateWarehouse,
};
