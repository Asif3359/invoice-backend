const { getPaymentsCollection } = require('../config/database');

// Payment Schema
const paymentSchema = {
  id: { type: String, required: true }, // UUID
  userEmail: { type: String, required: true },
  invoiceId: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  date: { type: Date, required: true },
  note: { type: String, default: '' },
  advance: { type: Boolean, default: false },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Validation function
const validatePayment = (data) => {
  const errors = [];
  
  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.invoiceId) errors.push('invoiceId is required');
  if (!data.amount) errors.push('amount is required');
  if (!data.method) errors.push('method is required');
  if (!data.date) errors.push('date is required');
  
  // Amount validation
  if (data.amount && data.amount <= 0) {
    errors.push('amount must be greater than 0');
  }
  
  // Method validation
  const validMethods = ['cash', 'card', 'bank_transfer', 'check', 'other'];
  if (data.method && !validMethods.includes(data.method)) {
    errors.push('method must be one of: cash, card, bank_transfer, check, other');
  }
  
  // Date validation
  if (data.date && isNaN(new Date(data.date).getTime())) {
    errors.push('Invalid date format');
  }
  
  return errors;
};

class Payment {
  // Create new payment
  static async create(data) {
    const errors = validatePayment(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const payment = {
      ...data,
      date: new Date(data.date),
      synced: 0,
      deleted: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const collection = getPaymentsCollection();
    const result = await collection.insertOne(payment);
    return { ...payment, _id: result.insertedId };
  }

  // Find all payments by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    const collection = getPaymentsCollection();
    return await collection.find(filter).toArray();
  }

  // Find payment by ID and user email
  static async findById(id, userEmail) {
    const collection = getPaymentsCollection();
    return await collection.findOne({ id, userEmail, deleted: 0 });
  }

  // Find payments by invoice ID
  static async findByInvoiceId(invoiceId, userEmail) {
    const collection = getPaymentsCollection();
    return await collection.find({ 
      invoiceId, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Update payment
  static async update(id, userEmail, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0
    };

    if (data.date) {
      updateData.date = new Date(data.date);
    }

    const collection = getPaymentsCollection();
    const result = await collection.updateOne(
      { id, userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('Payment not found or no permission');
    }

    return result;
  }

  // Soft delete payment
  static async delete(id, userEmail) {
    const collection = getPaymentsCollection();
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
      throw new Error('Payment not found or no permission');
    }

    return result;
  }

  // Sync payments
  static async sync(userEmail, payments) {
    if (!Array.isArray(payments)) {
      throw new Error('Payments must be an array');
    }

    const collection = getPaymentsCollection();
    const bulkOps = payments.map((item) => {
      const {
        id,
        invoiceId,
        amount,
        method,
        date,
        note,
        advance,
        createdAt,
        updatedAt = new Date(),
        deleted
      } = item;

      return {
        updateOne: {
          filter: { id, userEmail },
          update: {
            $set: {
              id,
              invoiceId,
              amount,
              method,
              date: new Date(date),
              note,
              advance,
              updatedAt: new Date(updatedAt),
              deleted,
              userEmail,
              synced: 0
            },
            $setOnInsert: {
              createdAt: createdAt ? new Date(createdAt) : new Date()
            }
          },
          upsert: true
        }
      };
    });

    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
    }

    return await this.findByUserEmail(userEmail);
  }

  // Get total payments for an invoice
  static async getTotalForInvoice(invoiceId, userEmail) {
    const payments = await this.findByInvoiceId(invoiceId, userEmail);
    return payments.reduce((total, payment) => total + payment.amount, 0);
  }

  // Get payments by date range
  static async findByDateRange(userEmail, startDate, endDate) {
    const collection = getPaymentsCollection();
    return await collection.find({
      userEmail,
      deleted: 0,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).toArray();
  }

  // Get payments by method
  static async findByMethod(userEmail, method) {
    const collection = getPaymentsCollection();
    return await collection.find({
      userEmail,
      deleted: 0,
      method
    }).toArray();
  }

  // Get unsynced payments
  static async getUnsynced(userEmail) {
    const collection = getPaymentsCollection();
    return await collection.find({ 
      userEmail, 
      synced: 0 
    }).toArray();
  }

  // Mark as synced
  static async markAsSynced(ids, userEmail) {
    if (ids.length === 0) return;
    
    const collection = getPaymentsCollection();
    await collection.updateMany(
      { id: { $in: ids }, userEmail },
      { $set: { synced: 1 } }
    );
  }
}

module.exports = {
  Payment,
  paymentSchema,
  validatePayment
};
