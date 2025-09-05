const { getCommissionHistoryCollection } = require('../config/database');

// Commission History Schema
const commissionHistorySchema = {
  id: { type: String, required: true }, // UUID
  userEmail: { type: String, required: true },
  agentId: { type: String, required: true },
  invoiceId: { type: String, default: '' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  paymentDate: { type: Date, default: null },
  paymentMethod: { type: String, default: '' },
  notes: { type: String, default: '' },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Validation function
const validateCommissionHistory = (data) => {
  const errors = [];
  
  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.agentId) errors.push('agentId is required');
  if (!data.amount) errors.push('amount is required');
  
  // Amount validation
  if (data.amount && data.amount <= 0) {
    errors.push('amount must be greater than 0');
  }
  
  // Status validation
  const validStatuses = ['paid', 'unpaid'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push('status must be paid or unpaid');
  }
  
  // Payment date validation
  if (data.paymentDate && isNaN(new Date(data.paymentDate).getTime())) {
    errors.push('Invalid paymentDate format');
  }
  
  // Payment method validation
  const validPaymentMethods = ['cash', 'card', 'bank_transfer', 'check', 'other'];
  if (data.paymentMethod && !validPaymentMethods.includes(data.paymentMethod)) {
    errors.push('paymentMethod must be one of: cash, card, bank_transfer, check, other');
  }
  
  return errors;
};

class CommissionHistory {
  // Create new commission history record
  static async create(data) {
    const errors = validateCommissionHistory(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const history = {
      ...data,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
      synced: 0,
      deleted: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const collection = getCommissionHistoryCollection();
    const result = await collection.insertOne(history);
    return { ...history, _id: result.insertedId };
  }

  // Find all commission history by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    const collection = getCommissionHistoryCollection();
    return await collection.find(filter).toArray();
  }

  // Find commission history by ID and user email
  static async findById(id, userEmail) {
    const collection = getCommissionHistoryCollection();
    return await collection.findOne({ id, userEmail, deleted: 0 });
  }

  // Find commission history by agent ID
  static async findByAgentId(agentId, userEmail) {
    const collection = getCommissionHistoryCollection();
    return await collection.find({ 
      agentId, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Find commission history by invoice ID
  static async findByInvoiceId(invoiceId, userEmail) {
    const collection = getCommissionHistoryCollection();
    return await collection.find({ 
      invoiceId, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Find commission history by status
  static async findByStatus(status, userEmail) {
    const collection = getCommissionHistoryCollection();
    return await collection.find({ 
      status, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Update commission history
  static async update(id, userEmail, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0
    };

    if (data.paymentDate) {
      updateData.paymentDate = new Date(data.paymentDate);
    }

    const collection = getCommissionHistoryCollection();
    const result = await collection.updateOne(
      { id, userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('Commission history not found or no permission');
    }

    return result;
  }

  // Soft delete commission history
  static async delete(id, userEmail) {
    const collection = getCommissionHistoryCollection();
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
      throw new Error('Commission history not found or no permission');
    }

    return result;
  }

  // Mark commission as paid
  static async markAsPaid(id, userEmail, paymentDate, paymentMethod, notes = '') {
    const collection = getCommissionHistoryCollection();
    const result = await collection.updateOne(
      { id, userEmail },
      { 
        $set: { 
          status: 'paid',
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMethod,
          notes,
          updatedAt: new Date(),
          synced: 0 
        } 
      }
    );

    if (result.matchedCount === 0) {
      throw new Error('Commission history not found or no permission');
    }

    return result;
  }

  // Mark commission as unpaid
  static async markAsUnpaid(id, userEmail) {
    const collection = getCommissionHistoryCollection();
    const result = await collection.updateOne(
      { id, userEmail },
      { 
        $set: { 
          status: 'unpaid',
          paymentDate: null,
          paymentMethod: '',
          notes: '',
          updatedAt: new Date(),
          synced: 0 
        } 
      }
    );

    if (result.matchedCount === 0) {
      throw new Error('Commission history not found or no permission');
    }

    return result;
  }

  // Sync commission history
  static async sync(userEmail, historyRecords) {
    if (!Array.isArray(historyRecords)) {
      throw new Error('Commission history must be an array');
    }

    const bulkOps = historyRecords.map((item) => {
      const {
        id,
        agentId,
        invoiceId,
        amount,
        status,
        paymentDate,
        paymentMethod,
        notes,
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
              agentId,
              invoiceId,
              amount,
              status,
              paymentDate: paymentDate ? new Date(paymentDate) : null,
              paymentMethod,
              notes,
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

    const collection = getCommissionHistoryCollection();
    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
    }

    return await this.findByUserEmail(userEmail);
  }

  // Get unsynced commission history
  static async getUnsynced(userEmail) {
    const collection = getCommissionHistoryCollection();
    return await collection.find({ 
      userEmail, 
      synced: 0 
    }).toArray();
  }

  // Mark as synced
  static async markAsSynced(ids, userEmail) {
    if (ids.length === 0) return;
    
    const collection = getCommissionHistoryCollection();
    await collection.updateMany(
      { id: { $in: ids }, userEmail },
      { $set: { synced: 1 } }
    );
  }

  // Get total commission amount for an agent
  static async getTotalForAgent(agentId, userEmail) {
    const collection = getCommissionHistoryCollection();
    const result = await collection.aggregate([
      { 
        $match: { 
          agentId, 
          userEmail, 
          deleted: 0 
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalAmount: { $sum: '$amount' } 
        } 
      }
    ]).toArray();
    
    return result.length > 0 ? result[0].totalAmount : 0;
  }

  // Get total paid commission for an agent
  static async getTotalPaidForAgent(agentId, userEmail) {
    const collection = getCommissionHistoryCollection();
    const result = await collection.aggregate([
      { 
        $match: { 
          agentId, 
          userEmail, 
          deleted: 0,
          status: 'paid'
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalPaid: { $sum: '$amount' } 
        } 
      }
    ]).toArray();
    
    return result.length > 0 ? result[0].totalPaid : 0;
  }

  // Get total unpaid commission for an agent
  static async getTotalUnpaidForAgent(agentId, userEmail) {
    const collection = getCommissionHistoryCollection();
    const result = await collection.aggregate([
      { 
        $match: { 
          agentId, 
          userEmail, 
          deleted: 0,
          status: 'unpaid'
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalUnpaid: { $sum: '$amount' } 
        } 
      }
    ]).toArray();
    
    return result.length > 0 ? result[0].totalUnpaid : 0;
  }

  // Get commission history by date range
  static async findByDateRange(userEmail, startDate, endDate) {
    const collection = getCommissionHistoryCollection();
    return await collection.find({
      userEmail,
      deleted: 0,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).toArray();
  }

  // Get commission history by payment date range
  static async findByPaymentDateRange(userEmail, startDate, endDate) {
    const collection = getCommissionHistoryCollection();
    return await collection.find({
      userEmail,
      deleted: 0,
      status: 'paid',
      paymentDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).toArray();
  }
}

module.exports = {
  CommissionHistory,
  commissionHistorySchema,
  validateCommissionHistory
};
