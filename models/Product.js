const { getProductsCollection } = require('../config/database');

// Product Schema
const productSchema = {
  id: { type: String, required: true }, // UUID
  userEmail: { type: String, required: true },
  productName: { type: String, required: true },
  productCode: { type: String, default: '' },
  unit: { type: String, default: '' },
  description: { type: String, default: '' },
  saleRate: { type: Number, default: 0 },
  buyRate: { type: Number, default: 0 },
  openingStock: { type: Number, default: 0 },
  openingStockRate: { type: Number, default: 0 },
  minAlertLevel: { type: Number, default: 0 },
  openingStockValue: { type: Number, default: 0 },
  enableInventory: { type: Boolean, default: true },
  warehouse: { type: String, default: '' },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Validation function
const validateProduct = (data) => {
  const errors = [];
  
  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.productName) errors.push('productName is required');
  
  // Numeric validations
  if (data.saleRate && data.saleRate < 0) {
    errors.push('saleRate cannot be negative');
  }
  
  if (data.buyRate && data.buyRate < 0) {
    errors.push('buyRate cannot be negative');
  }
  
  if (data.openingStock && data.openingStock < 0) {
    errors.push('openingStock cannot be negative');
  }
  
  if (data.minAlertLevel && data.minAlertLevel < 0) {
    errors.push('minAlertLevel cannot be negative');
  }
  
  return errors;
};

class Product {
  // Create new product
  static async create(data) {
    const errors = validateProduct(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const product = {
      ...data,
      synced: 0,
      deleted: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const collection = getProductsCollection();
    const result = await collection.insertOne(product);
    return { ...product, _id: result.insertedId };
  }

  // Find all products by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    const collection = getProductsCollection();
    return await collection.find(filter).toArray();
  }

  // Find product by ID and user email
  static async findById(id, userEmail) {
    const collection = getProductsCollection();
    return await collection.findOne({ id, userEmail, deleted: 0 });
  }

  // Update product
  static async update(id, userEmail, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0
    };

    const collection = getProductsCollection();
    const result = await collection.updateOne(
      { id, userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('Product not found or no permission');
    }

    return result;
  }

  // Soft delete product
  static async delete(id, userEmail) {
    const collection = getProductsCollection();
    const result = await collection.updateOne(
      { id, userEmail },
      { 
        $set: { 
          deleted: 1, 
          updatedAt: new Date(), 
          synced: 0 
        } 
      }
    );

    if (result.matchedCount === 0) {
      throw new Error('Product not found or no permission');
    }

    return result;
  }

  // Sync products
  static async sync(userEmail, products) {
    if (!Array.isArray(products)) {
      throw new Error('Products must be an array');
    }

    const bulkOps = products.map((item) => {
      const {
        createdAt,
        id,
        productName,
        productCode,
        unit,
        description,
        saleRate,
        buyRate,
        openingStock,
        openingStockRate,
        minAlertLevel,
        openingStockValue,
        enableInventory,
        warehouse,
        updatedAt = new Date(),
        deleted,
      } = item;

      return {
        updateOne: {
          filter: { id, userEmail },
          update: {
            $set: {
              id,
              productName,
              productCode,
              unit,
              description,
              saleRate,
              buyRate,
              openingStock,
              openingStockRate,
              minAlertLevel,
              openingStockValue,
              enableInventory,
              warehouse,
              updatedAt: new Date(updatedAt),
              synced: 0,
              deleted,
              userEmail
            },
            $setOnInsert: {
              createdAt: createdAt ? new Date(createdAt) : new Date()
            }
          },
          upsert: true
        }
      };
    });

    const collection = getProductsCollection();
    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
    }

    return await this.findByUserEmail(userEmail);
  }

  // Get products with low stock
  static async getLowStock(userEmail) {
    const collection = getProductsCollection();
    return await collection.find({
      userEmail,
      deleted: 0,
      enableInventory: true,
      $expr: {
        $lte: ['$openingStock', '$minAlertLevel']
      }
    }).toArray();
  }

  // Search products by name or code
  static async search(userEmail, searchTerm) {
    const regex = new RegExp(searchTerm, 'i');
    const collection = getProductsCollection();
    return await collection.find({
      userEmail,
      deleted: 0,
      $or: [
        { productName: regex },
        { productCode: regex },
        { description: regex }
      ]
    }).toArray();
  }

  // Get unsynced products
  static async getUnsynced(userEmail) {
    const collection = getProductsCollection();
    return await collection.find({ 
      userEmail, 
      synced: 0 
    }).toArray();
  }

  // Mark as synced
  static async markAsSynced(ids, userEmail) {
    if (ids.length === 0) return;
    
    const collection = getProductsCollection();
    await collection.updateMany(
      { id: { $in: ids }, userEmail },
      { $set: { synced: 1 } }
    );
  }
}

module.exports = {
  Product,
  productSchema,
  validateProduct
};
