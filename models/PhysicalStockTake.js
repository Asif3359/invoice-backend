const { getPhysicalStockTakeCollection } = require('../config/database');

// Physical Stock Take Schema
const physicalStockTakeSchema = {
  id: { type: String, required: true },
  userEmail: { type: String, required: true },
  date: { type: String, required: true },
  productId: { type: String, required: true },
  countedStock: { type: Number, required: true },
  expectedStock: { type: Number, required: true },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Validation function
const validatePhysicalStockTake = (data) => {
  const errors = [];
  
  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.date) errors.push('date is required');
  if (!data.productId) errors.push('productId is required');
  if (data.countedStock === undefined) errors.push('countedStock is required');
  if (data.expectedStock === undefined) errors.push('expectedStock is required');
  
  return errors;
};

class PhysicalStockTake {
  // Find all physical stock takes by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    return await getPhysicalStockTakeCollection().find(filter).toArray();
  }

  // Find physical stock take by ID and user email
  static async findById(id, userEmail) {
    return await getPhysicalStockTakeCollection().findOne({ id, userEmail, deleted: 0 });
  }

  // Find physical stock takes by date
  static async findByDate(date, userEmail) {
    return await getPhysicalStockTakeCollection().find({ 
      date, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Find physical stock takes by product ID
  static async findByProductId(productId, userEmail) {
    return await getPhysicalStockTakeCollection().find({ 
      productId, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Sync physical stock takes
  static async sync(userEmail, physicalStockTakes) {
    if (!Array.isArray(physicalStockTakes)) {
      throw new Error('physicalStockTakes must be an array');
    }

    const stockTakeOps = physicalStockTakes.map((item) => {
      const {
        id, date, productId, countedStock, expectedStock,
        createdAt, updatedAt, deleted
      } = item;

      return {
        updateOne: {
          filter: { id, userEmail },
          update: {
            $set: {
              id, date, productId, countedStock, expectedStock,
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

    if (stockTakeOps.length > 0) {
      await getPhysicalStockTakeCollection().bulkWrite(stockTakeOps);
    }

    // Return fresh data
    const freshStockTakes = await this.findByUserEmail(userEmail);

    return { physicalStockTakes: freshStockTakes };
  }
}

module.exports = {
  PhysicalStockTake,
  physicalStockTakeSchema,
  validatePhysicalStockTake
};

