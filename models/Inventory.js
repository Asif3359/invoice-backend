const { getInventoryCollection } = require('../config/database');

// Inventory Schema
const inventorySchema = {
  id: { type: String, required: true },
  userEmail: { type: String, required: true },
  productId: { type: String, required: true },
  warehouseId: { type: String, default: null },
  closingStock: { type: Number, default: 0 },
  closingStockRate: { type: Number, default: 0 },
  inventoryMode: { type: String, enum: ['in', 'out'], default: 'in' },
  inventoryComment: { type: String, default: '' },
  isTransfer: { type: Number, default: 0 },
  stockTransferId: { type: String, default: null },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Validation function
const validateInventory = (data) => {
  const errors = [];
  
  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.productId) errors.push('productId is required');
  
  return errors;
};

class Inventory {
  // Find all inventory by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    return await getInventoryCollection().find(filter).toArray();
  }

  // Find inventory by ID and user email
  static async findById(id, userEmail) {
    return await getInventoryCollection().findOne({ id, userEmail, deleted: 0 });
  }

  // Find inventory by product ID
  static async findByProductId(productId, userEmail) {
    return await getInventoryCollection().find({ 
      productId, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Find inventory by warehouse ID
  static async findByWarehouseId(warehouseId, userEmail) {
    return await getInventoryCollection().find({ 
      warehouseId, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Sync inventory
  static async sync(userEmail, inventory) {
    if (!Array.isArray(inventory)) {
      throw new Error('inventory must be an array');
    }

    const inventoryOps = inventory.map((item) => {
      const {
        id, productId, warehouseId, closingStock, closingStockRate,
        inventoryMode, inventoryComment, isTransfer, stockTransferId,
        createdAt, updatedAt, deleted
      } = item;

      return {
        updateOne: {
          filter: { id, userEmail },
          update: {
            $set: {
              id, productId, warehouseId, closingStock, closingStockRate,
              inventoryMode, inventoryComment, isTransfer, stockTransferId,
              updatedAt: new Date(updatedAt), deleted,
              userEmail, synced: 0
            },
            $setOnInsert: {
              createdAt: createdAt ? new Date(createdAt) : new Date()
            }
          },
          upsert: true
        }
      };
    });

    if (inventoryOps.length > 0) {
      await getInventoryCollection().bulkWrite(inventoryOps);
    }

    // Return fresh data
    const freshInventory = await this.findByUserEmail(userEmail);

    return { inventory: freshInventory };
  }
}

module.exports = {
  Inventory,
  inventorySchema,
  validateInventory
};

