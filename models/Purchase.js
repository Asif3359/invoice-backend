const { getPurchasesCollection, getPurchaseItemsCollection, getPurchasePaymentsCollection } = require('../config/database');

// Purchase Schema
const purchaseSchema = {
  id: { type: String, required: true },
  userEmail: { type: String, required: true },
  purchaseNumber: { type: String, required: true },
  purchaseDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  supplierId: { type: String, required: true },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  adjustment: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  attachments: { type: Array, default: [] },
  status: { type: String, enum: ['draft', 'ordered', 'received', 'paid', 'cancelled'], default: 'draft' },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Validation function
const validatePurchase = (data) => {
  const errors = [];
  
  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.purchaseNumber) errors.push('purchaseNumber is required');
  if (!data.supplierId) errors.push('supplierId is required');
  
  // Date validations
  if (data.purchaseDate && isNaN(new Date(data.purchaseDate).getTime())) {
    errors.push('Invalid purchaseDate format');
  }
  
  if (data.dueDate && isNaN(new Date(data.dueDate).getTime())) {
    errors.push('Invalid dueDate format');
  }
  
  // Numeric validations
  if (data.subtotal && data.subtotal < 0) errors.push('subtotal cannot be negative');
  if (data.discount && data.discount < 0) errors.push('discount cannot be negative');
  if (data.tax && data.tax < 0) errors.push('tax cannot be negative');
  if (data.shipping && data.shipping < 0) errors.push('shipping cannot be negative');
  if (data.total && data.total < 0) errors.push('total cannot be negative');
  
  return errors;
};

class Purchase {
  // Create new purchase
  static async create(data) {
    const errors = validatePurchase(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const purchase = {
      ...data,
      purchaseDate: new Date(data.purchaseDate),
      dueDate: new Date(data.dueDate),
      synced: 0,
      deleted: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await getPurchasesCollection().insertOne(purchase);
    return { ...purchase, _id: result.insertedId };
  }

  // Find all purchases by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    return await getPurchasesCollection().find(filter).toArray();
  }

  // Find purchase by ID and user email
  static async findById(id, userEmail) {
    return await getPurchasesCollection().findOne({ id, userEmail, deleted: 0 });
  }

  // Update purchase
  static async update(id, userEmail, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0
    };

    if (data.purchaseDate) {
      updateData.purchaseDate = new Date(data.purchaseDate);
    }
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    const result = await getPurchasesCollection().updateOne(
      { id, userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('Purchase not found or no permission');
    }

    return result;
  }

  // Soft delete purchase
  static async delete(id, userEmail) {
    const result = await getPurchasesCollection().updateOne(
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
      throw new Error('Purchase not found or no permission');
    }

    return result;
  }

  // Sync purchases
  static async sync(userEmail, purchases, purchaseItems, purchasePayments) {
    if (!Array.isArray(purchases) || !Array.isArray(purchaseItems) || !Array.isArray(purchasePayments)) {
      throw new Error('purchases, purchaseItems, and purchasePayments must be arrays');
    }

    // Sync purchases
    const purchaseOps = purchases.map((item) => {
      const {
        id, purchaseNumber, purchaseDate, dueDate, supplierId, subtotal,
        discount, tax, shipping, adjustment, total, notes, attachments,
        status, createdAt, updatedAt, deleted
      } = item;

      return {
        updateOne: {
          filter: { id, userEmail },
          update: {
            $set: {
              id, purchaseNumber, purchaseDate: new Date(purchaseDate), 
              dueDate: new Date(dueDate), supplierId, subtotal,
              discount, tax, shipping, adjustment, total, notes, 
              attachments, status, updatedAt: new Date(updatedAt), deleted,
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

    if (purchaseOps.length > 0) {
      await getPurchasesCollection().bulkWrite(purchaseOps);
    }

    // Sync purchase items
    const itemOps = purchaseItems.map((item) => {
      const {
        id, purchaseId, productId, qty, rate, discount, 
        discountType, description, updatedAt, deleted
      } = item;

      return {
        updateOne: {
          filter: { id, userEmail },
          update: {
            $set: {
              id, purchaseId, productId, qty, rate, discount,
              discountType, description, updatedAt: new Date(updatedAt),
              deleted, userEmail, synced: 0
            }
          },
          upsert: true
        }
      };
    });

    if (itemOps.length > 0) {
      await getPurchaseItemsCollection().bulkWrite(itemOps);
    }

    // Sync purchase payments
    const paymentOps = purchasePayments.map((item) => {
      const {
        id, purchaseId, method, amount, note, paidAt, updatedAt, deleted
      } = item;

      return {
        updateOne: {
          filter: { id, userEmail },
          update: {
            $set: {
              id, purchaseId, method, amount, note,
              paidAt: new Date(paidAt), updatedAt: new Date(updatedAt),
              deleted, userEmail, synced: 0
            }
          },
          upsert: true
        }
      };
    });

    if (paymentOps.length > 0) {
      await getPurchasePaymentsCollection().bulkWrite(paymentOps);
    }

    // Return fresh data
    const [freshPurchases, freshItems, freshPayments] = await Promise.all([
      this.findByUserEmail(userEmail),
      PurchaseItem.findByUserEmail(userEmail),
      PurchasePayment.findByUserEmail(userEmail)
    ]);

    return { 
      purchases: freshPurchases, 
      purchaseItems: freshItems, 
      purchasePayments: freshPayments 
    };
  }
}

class PurchaseItem {
  // Find all items by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    return await getPurchaseItemsCollection().find(filter).toArray();
  }

  // Find items by purchase ID
  static async findByPurchaseId(purchaseId, userEmail) {
    return await getPurchaseItemsCollection().find({ 
      purchaseId, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }
}

class PurchasePayment {
  // Find all payments by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    return await getPurchasePaymentsCollection().find(filter).toArray();
  }

  // Find payments by purchase ID
  static async findByPurchaseId(purchaseId, userEmail) {
    return await getPurchasePaymentsCollection().find({ 
      purchaseId, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }
}

module.exports = {
  Purchase,
  PurchaseItem,
  PurchasePayment,
  purchaseSchema,
  validatePurchase
};
