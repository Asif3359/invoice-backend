const { getCreditNotesCollection } = require('../config/database');

// Credit Note Schema
const creditNoteSchema = {
  id: { type: String, required: true }, // UUID
  userEmail: { type: String, required: true },
  creditNo: { type: String, required: true },
  ref: { type: String, default: '' },
  invoiceNo: { type: String, default: '' },
  date: { type: Date, required: true },
  invoiceId: { type: String, default: '' },
  clientId: { type: String, required: true },
  creditAmount: { type: Number, default: 0 },
  headNote: { type: String, default: '' },
  footNote: { type: String, default: '' },
  pleaseNote: { type: String, default: '' },
  notes: { type: String, default: '' },
  signature: { type: String, default: '' },
  formState: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'sent', 'applied', 'cancelled'], default: 'draft' },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Validation function
const validateCreditNote = (data) => {
  const errors = [];
  
  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.creditNo) errors.push('creditNo is required');
  if (!data.clientId) errors.push('clientId is required');
  
  // Date validation
  if (data.date && isNaN(new Date(data.date).getTime())) {
    errors.push('Invalid date format');
  }
  
  // Numeric validations
  if (data.creditAmount && data.creditAmount < 0) {
    errors.push('creditAmount cannot be negative');
  }
  
  // Status validation
  const validStatuses = ['draft', 'sent', 'applied', 'cancelled'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push('status must be one of: draft, sent, applied, cancelled');
  }
  
  return errors;
};

class CreditNote {
  // Create new credit note
  static async create(data) {
    const errors = validateCreditNote(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const creditNote = {
      ...data,
      date: new Date(data.date),
      synced: 0,
      deleted: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const collection = getCreditNotesCollection();
    const result = await collection.insertOne(creditNote);
    return { ...creditNote, _id: result.insertedId };
  }

  // Find all credit notes by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    const collection = getCreditNotesCollection();
    return await collection.find(filter).toArray();
  }

  // Find credit note by ID and user email
  static async findById(id, userEmail) {
    const collection = getCreditNotesCollection();
    return await collection.findOne({ id, userEmail, deleted: 0 });
  }

  // Find credit notes by client ID
  static async findByClientId(clientId, userEmail) {
    const collection = getCreditNotesCollection();
    return await collection.find({ 
      clientId, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Find credit notes by invoice ID
  static async findByInvoiceId(invoiceId, userEmail) {
    const collection = getCreditNotesCollection();
    return await collection.find({ 
      invoiceId, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Find credit notes by status
  static async findByStatus(status, userEmail) {
    const collection = getCreditNotesCollection();
    return await collection.find({ 
      status, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Find credit note by credit number
  static async findByCreditNo(creditNo, userEmail) {
    const collection = getCreditNotesCollection();
    return await collection.findOne({ 
      creditNo, 
      userEmail, 
      deleted: 0 
    });
  }

  // Update credit note
  static async update(id, userEmail, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0
    };

    if (data.date) {
      updateData.date = new Date(data.date);
    }

    const collection = getCreditNotesCollection();
    const result = await collection.updateOne(
      { id, userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('Credit note not found or no permission');
    }

    return result;
  }

  // Soft delete credit note
  static async delete(id, userEmail) {
    const collection = getCreditNotesCollection();
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
      throw new Error('Credit note not found or no permission');
    }

    return result;
  }

  // Sync credit notes
  static async sync(userEmail, creditNotes) {
    if (!Array.isArray(creditNotes)) {
      throw new Error('Credit notes must be an array');
    }

    const bulkOps = creditNotes.map((item) => {
      const {
        createdAt,
        id,
        creditNo,
        ref,
        invoiceNo,
        date,
        invoiceId,
        clientId,
        creditAmount,
        headNote,
        footNote,
        pleaseNote,
        notes,
        signature,
        formState,
        status,
        updatedAt = new Date(),
        deleted,
      } = item;

      return {
        updateOne: {
          filter: { id, userEmail },
          update: {
            $set: {
              id,
              creditNo,
              ref,
              invoiceNo,
              date: new Date(date),
              invoiceId,
              clientId,
              creditAmount,
              headNote,
              footNote,
              pleaseNote,
              notes,
              signature,
              formState,
              status,
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

    const collection = getCreditNotesCollection();
    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
    }

    return await this.findByUserEmail(userEmail);
  }

  // Get unsynced credit notes
  static async getUnsynced(userEmail) {
    const collection = getCreditNotesCollection();
    return await collection.find({ 
      userEmail, 
      synced: 0 
    }).toArray();
  }

  // Mark as synced
  static async markAsSynced(ids, userEmail) {
    if (ids.length === 0) return;
    
    const collection = getCreditNotesCollection();
    await collection.updateMany(
      { id: { $in: ids }, userEmail },
      { $set: { synced: 1 } }
    );
  }

  // Get credit notes by date range
  static async findByDateRange(userEmail, startDate, endDate) {
    const collection = getCreditNotesCollection();
    return await collection.find({
      userEmail,
      deleted: 0,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).toArray();
  }

  // Get total credit amount by client
  static async getTotalCreditByClient(clientId, userEmail) {
    const collection = getCreditNotesCollection();
    const result = await collection.aggregate([
      {
        $match: {
          clientId,
          userEmail,
          deleted: 0,
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: '$clientId',
          totalCredit: { $sum: '$creditAmount' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    return result[0] || { _id: clientId, totalCredit: 0, count: 0 };
  }

  // Search credit notes
  static async search(userEmail, searchTerm) {
    const regex = new RegExp(searchTerm, 'i');
    const collection = getCreditNotesCollection();
    return await collection.find({
      userEmail,
      deleted: 0,
      $or: [
        { creditNo: regex },
        { ref: regex },
        { invoiceNo: regex },
        { notes: regex }
      ]
    }).toArray();
  }
}

module.exports = {
  CreditNote,
  creditNoteSchema,
  validateCreditNote
};
