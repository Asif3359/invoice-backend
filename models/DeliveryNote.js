const { 
  getDeliveryNotesCollection, 
  getDeliveryNoteItemsCollection 
} = require('../config/database');

// Delivery Note Schema
const deliveryNoteSchema = {
  id: { type: String, required: true }, // UUID
  userEmail: { type: String, required: true },
  deliveryNoteNumber: { type: String, required: true },
  deliveryNoteDate: { type: Date, required: true },
  dueDate: { type: Date },
  clientId: { type: String, required: true },
  ref: { type: String, default: '' },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  adjustment: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  headNote: { type: String, default: '' },
  footNote: { type: String, default: '' },
  pleaseNote: { type: String, default: '' },
  signature: { type: String, default: '' },
  formState: { type: String, default: '' },
  attachments: { type: Array, default: [] },
  status: { type: String, enum: ['draft', 'sent', 'fulfilled', 'cancelled'], default: 'draft' },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Delivery Note Item Schema
const deliveryNoteItemSchema = {
  id: { type: String, required: true }, // UUID
  userEmail: { type: String, required: true },
  deliveryNoteId: { type: String, required: true },
  productId: { type: String, required: true },
  qty: { type: Number, required: true },
  rate: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  description: { type: String, default: '' },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Validation functions
const validateDeliveryNote = (data) => {
  const errors = [];

  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.deliveryNoteNumber) errors.push('deliveryNoteNumber is required');
  if (!data.clientId) errors.push('clientId is required');

  // Date validations
  if (data.deliveryNoteDate && isNaN(new Date(data.deliveryNoteDate).getTime())) {
    errors.push('Invalid deliveryNoteDate format');
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

  // Status validation
  const validStatuses = ['draft', 'sent', 'fulfilled', 'cancelled'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push('status must be one of: draft, sent, fulfilled, cancelled');
  }

  return errors;
};

const validateDeliveryNoteItem = (data) => {
  const errors = [];

  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.deliveryNoteId) errors.push('deliveryNoteId is required');
  if (!data.productId) errors.push('productId is required');
  if (!data.qty && data.qty !== 0) errors.push('qty is required');

  // Numeric validations
  if (data.qty && data.qty <= 0) errors.push('qty must be greater than 0');
  if (data.rate && data.rate < 0) errors.push('rate cannot be negative');
  if (data.discount && data.discount < 0) errors.push('discount cannot be negative');

  // Discount type validation
  const validDiscountTypes = ['percentage', 'fixed'];
  if (data.discountType && !validDiscountTypes.includes(data.discountType)) {
    errors.push('discountType must be percentage or fixed');
  }

  return errors;
};

class DeliveryNote {
  // Create new delivery note
  static async create(data) {
    const errors = validateDeliveryNote(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const doc = {
      ...data,
      deliveryNoteDate: new Date(data.deliveryNoteDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      synced: 0,
      deleted: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await getDeliveryNotesCollection().insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  // Find all by user
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    return await getDeliveryNotesCollection().find(filter).toArray();
  }

  // Find by ID
  static async findById(id, userEmail) {
    return await getDeliveryNotesCollection().findOne({ id, userEmail, deleted: 0 });
  }

  // Find by client
  static async findByClientId(clientId, userEmail) {
    return await getDeliveryNotesCollection().find({ clientId, userEmail, deleted: 0 }).toArray();
  }

  // Find by status
  static async findByStatus(status, userEmail) {
    return await getDeliveryNotesCollection().find({ status, userEmail, deleted: 0 }).toArray();
  }

  // Update
  static async update(id, userEmail, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0
    };

    if (data.deliveryNoteDate) {
      updateData.deliveryNoteDate = new Date(data.deliveryNoteDate);
    }
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    const result = await getDeliveryNotesCollection().updateOne(
      { id, userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('Delivery Note not found or no permission');
    }

    return result;
  }

  // Soft delete
  static async delete(id, userEmail) {
    const result = await getDeliveryNotesCollection().updateOne(
      { id, userEmail },
      { $set: { deleted: 1, updatedAt: new Date(), synced: 0 } }
    );

    if (result.matchedCount === 0) {
      throw new Error('Delivery Note not found or no permission');
    }

    return result;
  }

  // Get with items
  static async getWithItems(id, userEmail) {
    const note = await this.findById(id, userEmail);
    if (!note) return null;
    const items = await DeliveryNoteItem.findByDeliveryNoteId(id, userEmail);
    return { ...note, items };
  }

  // Calculate totals
  static calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.qty * (item.rate || 0);
      const discountAmount = item.discountType === 'percentage'
        ? (itemTotal * (item.discount || 0) / 100)
        : (item.discount || 0);
      return sum + (itemTotal - discountAmount);
    }, 0);

    return {
      subtotal,
      total: subtotal // Extend with tax, shipping, adjustment as needed
    };
  }

  // Sync notes and items
  static async sync(userEmail, deliveryNotes, deliveryNoteItems) {
    if (!Array.isArray(deliveryNotes) || !Array.isArray(deliveryNoteItems)) {
      throw new Error('deliveryNotes and deliveryNoteItems must be arrays');
    }

    // Notes
    const noteOps = deliveryNotes.map((item) => {
      const {
        id, deliveryNoteNumber, deliveryNoteDate, dueDate, clientId, ref,
        subtotal, discount, tax, shipping, adjustment, total, notes, headNote,
        footNote, pleaseNote, signature, formState, attachments, status,
        createdAt, updatedAt, deleted
      } = item;

      return {
        updateOne: {
          filter: { id, userEmail },
          update: {
            $set: {
              id,
              deliveryNoteNumber,
              deliveryNoteDate: new Date(deliveryNoteDate),
              dueDate: dueDate ? new Date(dueDate) : null,
              clientId,
              ref,
              subtotal,
              discount,
              tax,
              shipping,
              adjustment,
              total,
              notes,
              headNote,
              footNote,
              pleaseNote,
              signature,
              formState,
              attachments,
              status,
              updatedAt: new Date(updatedAt),
              deleted: (deleted ?? 0),
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

    if (noteOps.length > 0) {
      await getDeliveryNotesCollection().bulkWrite(noteOps);
    }

    // Items
    const itemOps = deliveryNoteItems.map((item) => {
      const {
        id, deliveryNoteId, productId, qty, rate, discount, discountType,
        description, updatedAt, deleted
      } = item;

      return {
        updateOne: {
          filter: { id, userEmail },
          update: {
            $set: {
              id,
              deliveryNoteId,
              productId,
              qty,
              rate: (rate ?? 0),
              discount: (discount ?? 0),
              discountType,
              description,
              updatedAt: new Date(updatedAt || Date.now()),
              deleted: (deleted ?? 0),
              userEmail,
              synced: 0
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          upsert: true
        }
      };
    });

    if (itemOps.length > 0) {
      await getDeliveryNoteItemsCollection().bulkWrite(itemOps);
    }

    const [freshNotes, freshItems] = await Promise.all([
      this.findByUserEmail(userEmail),
      DeliveryNoteItem.findByUserEmail(userEmail)
    ]);

    return { deliveryNotes: freshNotes, deliveryNoteItems: freshItems };
  }
}

class DeliveryNoteItem {
  // Create new item
  static async create(data) {
    const errors = validateDeliveryNoteItem(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const doc = {
      ...data,
      synced: 0,
      deleted: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await getDeliveryNoteItemsCollection().insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  // Find all items by user
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    return await getDeliveryNoteItemsCollection().find(filter).toArray();
  }

  // Find by delivery note id
  static async findByDeliveryNoteId(deliveryNoteId, userEmail) {
    return await getDeliveryNoteItemsCollection().find({ deliveryNoteId, userEmail, deleted: 0 }).toArray();
  }

  // Find by ID
  static async findById(id, userEmail) {
    return await getDeliveryNoteItemsCollection().findOne({ id, userEmail, deleted: 0 });
  }

  // Update
  static async update(id, userEmail, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0
    };

    const result = await getDeliveryNoteItemsCollection().updateOne(
      { id, userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('Delivery Note item not found or no permission');
    }

    return result;
  }

  // Soft delete
  static async delete(id, userEmail) {
    const result = await getDeliveryNoteItemsCollection().updateOne(
      { id, userEmail },
      { $set: { deleted: 1, updatedAt: new Date(), synced: 0 } }
    );

    if (result.matchedCount === 0) {
      throw new Error('Delivery Note item not found or no permission');
    }

    return result;
  }
}

// sync delivery notes
const syncDeliveryNotes = async (req, res) => {
  try {
    const { userEmail, deliveryNotes, deliveryNoteItems } = req.body;

    if (!userEmail || !Array.isArray(deliveryNotes) || !Array.isArray(deliveryNoteItems)) {
      return res.status(400).send("Missing userEmail or invalid data");
    }

    const notesCollection = getDeliveryNotesCollection();
    const itemsCollection = getDeliveryNoteItemsCollection();

    // === 🔁 Sync Delivery Notes ===
    const noteOps = deliveryNotes.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id,
        deliveryNoteNumber,
        deliveryNoteDate,
        dueDate,
        clientId,
        ref,
        subtotal,
        discount,
        tax,
        shipping,
        adjustment,
        total,
        notes,
        headNote,
        footNote,
        pleaseNote,
        signature,
        formState,
        attachments,
        status,
        createdAt,
        updatedAt,
        deleted
      } = item;

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              id,
              deliveryNoteNumber,
              deliveryNoteDate,
              dueDate: dueDate ?? null,
              clientId,
              ref,
              subtotal,
              discount,
              tax,
              shipping,
              adjustment,
              total,
              notes,
              headNote,
              footNote,
              pleaseNote,
              signature,
              formState,
              attachments,
              status,
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

    if (noteOps.length > 0) {
      await notesCollection.bulkWrite(noteOps);
    }

    // === 🔁 Sync Delivery Note Items ===
    const itemOps = deliveryNoteItems.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id,
        deliveryNoteId,
        productId,
        qty,
        rate,
        discount,
        discountType,
        description,
        updatedAt,
        deleted
      } = item;

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              id,
              deliveryNoteId,
              productId,
              qty,
              rate,
              discount,
              discountType,
              description,
              updatedAt: new Date(updatedAt),
              deleted,
              userEmail,
              synced: 0
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          upsert: true
        }
      };
    });

    if (itemOps.length > 0) {
      await itemsCollection.bulkWrite(itemOps);
    }

    // === ✅ Send back all latest data
    const [freshNotes, freshItems] = await Promise.all([
      notesCollection.find({ userEmail }).project({ userEmail: 0 }).toArray(),
      itemsCollection.find({ userEmail }).project({ userEmail: 0 }).toArray()
    ]);

    res.send({
      success: true,
      deliveryNotes: freshNotes,
      deliveryNoteItems: freshItems
    });

  } catch (error) {
    console.error("❌ Delivery Note sync error:", error);
    res.status(500).send("Error syncing delivery notes");
  }
};

module.exports = {
  DeliveryNote,
  DeliveryNoteItem,
  deliveryNoteSchema,
  deliveryNoteItemSchema,
  validateDeliveryNote,
  validateDeliveryNoteItem,
  syncDeliveryNotes
};


