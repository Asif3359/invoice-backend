const { getStockTransferHistoryCollection } = require('../config/database');

// Stock Transfer History Schema
const stockTransferHistorySchema = {
  id: { type: String, required: true },
  userEmail: { type: String, required: true },
  fromWarehouseId: { type: String, default: null },
  toWarehouseId: { type: String, default: null },
  itemList: { type: String, required: true }, // JSON stringified array
  transferAt: { type: Date, default: Date.now },
  note: { type: String, default: '' },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Validation function
const validateStockTransfer = (data) => {
  const errors = [];
  
  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.itemList) errors.push('itemList is required');
  
  return errors;
};

class StockTransfer {
  // Find all stock transfers by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    return await getStockTransferHistoryCollection().find(filter).toArray();
  }

  // Find stock transfer by ID and user email
  static async findById(id, userEmail) {
    return await getStockTransferHistoryCollection().findOne({ id, userEmail, deleted: 0 });
  }

  // Find stock transfers by warehouse
  static async findByWarehouse(warehouseId, userEmail, direction = 'both') {
    const filter = { userEmail, deleted: 0 };
    
    if (direction === 'from') {
      filter.fromWarehouseId = warehouseId;
    } else if (direction === 'to') {
      filter.toWarehouseId = warehouseId;
    } else {
      // both directions
      filter.$or = [
        { fromWarehouseId: warehouseId },
        { toWarehouseId: warehouseId }
      ];
    }
    
    return await getStockTransferHistoryCollection().find(filter).toArray();
  }

  // Sync stock transfers
  static async sync(userEmail, stockTransfers) {
    if (!Array.isArray(stockTransfers)) {
      throw new Error('stockTransfers must be an array');
    }

    const transferOps = stockTransfers.map((item) => {
      const {
        id, fromWarehouseId, toWarehouseId, itemList, transferAt, note,
        createdAt, updatedAt, deleted
      } = item;

      return {
        updateOne: {
          filter: { id, userEmail },
          update: {
            $set: {
              id, fromWarehouseId, toWarehouseId, itemList,
              transferAt: transferAt ? new Date(transferAt) : new Date(),
              note, updatedAt: new Date(updatedAt), deleted,
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

    if (transferOps.length > 0) {
      await getStockTransferHistoryCollection().bulkWrite(transferOps);
    }

    // Return fresh data
    const freshTransfers = await this.findByUserEmail(userEmail);

    return { stockTransfers: freshTransfers };
  }
}

module.exports = {
  StockTransfer,
  stockTransferHistorySchema,
  validateStockTransfer
};

