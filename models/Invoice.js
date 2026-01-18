const { getInvoicesCollection, getInvoiceItemsCollection } = require('../config/database');

// Invoice Schema
const invoiceSchema = {
  id: { type: String, required: true }, // UUID
  userEmail: { type: String, required: true },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: Date, required: true },
  invoiceNote: { type: String, default: '' },
  invoiceRef: { type: String, default: '' },
  dueDate: { type: Date, required: true },
  clientId: { type: String, required: true },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  adjustment: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  signature: { type: String, default: '' },
  attachments: { type: Array, default: [] },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], default: 'draft' },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Invoice Item Schema
const invoiceItemSchema = {
  id: { type: String, required: true }, // UUID
  userEmail: { type: String, required: true },
  invoiceId: { type: String, required: true },
  productId: { type: String, required: true },
  qty: { type: Number, required: true },
  rate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  description: { type: String, default: '' },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Validation functions
const validateInvoice = (data) => {
  const errors = [];
  
  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.invoiceNumber) errors.push('invoiceNumber is required');
  if (!data.clientId) errors.push('clientId is required');
  
  // Date validations
  if (data.invoiceDate && isNaN(new Date(data.invoiceDate).getTime())) {
    errors.push('Invalid invoiceDate format');
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
  const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push('status must be one of: draft, sent, paid, overdue, cancelled');
  }
  
  return errors;
};

const validateInvoiceItem = (data) => {
  const errors = [];
  
  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.invoiceId) errors.push('invoiceId is required');
  if (!data.productId) errors.push('productId is required');
  if (!data.qty) errors.push('qty is required');
  if (!data.rate) errors.push('rate is required');
  
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

class Invoice {
  // Create new invoice
  static async create(data) {
    const errors = validateInvoice(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const invoice = {
      ...data,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: new Date(data.dueDate),
      synced: 0,
      deleted: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await getInvoicesCollection().insertOne(invoice);
    return { ...invoice, _id: result.insertedId };
  }

  // Find all invoices by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    return await getInvoicesCollection().find(filter).toArray();
  }

  // Find invoice by ID and user email
  static async findById(id, userEmail) {
    return await getInvoicesCollection().findOne({ id, userEmail, deleted: 0 });
  }

  // Find invoices by client ID
  static async findByClientId(clientId, userEmail) {
    return await getInvoicesCollection().find({ 
      clientId, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Find invoices by status
  static async findByStatus(status, userEmail) {
    return await getInvoicesCollection().find({ 
      status, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Update invoice
  static async update(id, userEmail, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0
    };

    if (data.invoiceDate) {
      updateData.invoiceDate = new Date(data.invoiceDate);
    }
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    const result = await getInvoicesCollection().updateOne(
      { id, userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('Invoice not found or no permission');
    }

    return result;
  }

  // Soft delete invoice
  static async delete(id, userEmail) {
    const result = await getInvoicesCollection().updateOne(
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
      throw new Error('Invoice not found or no permission');
    }

    return result;
  }

  // Get invoice with items
  static async getWithItems(id, userEmail) {
    const invoice = await this.findById(id, userEmail);
    if (!invoice) return null;

    const items = await InvoiceItem.findByInvoiceId(id, userEmail);
    return { ...invoice, items };
  }

  // Calculate invoice totals
  static calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.qty * item.rate;
      const discount = item.discountType === 'percentage' 
        ? (itemTotal * item.discount / 100)
        : item.discount;
      return sum + (itemTotal - discount);
    }, 0);

    return {
      subtotal,
      total: subtotal // Add tax, shipping, adjustment as needed
    };
  }

  // Get overdue invoices
  static async getOverdue(userEmail) {
    const today = new Date();
    return await getInvoicesCollection().find({
      userEmail,
      deleted: 0,
      status: { $nin: ['paid', 'cancelled'] },
      dueDate: { $lt: today }
    }).toArray();
  }

  // Sync invoices and items
  static async sync(userEmail, invoices, invoiceItems) {
    if (!Array.isArray(invoices) || !Array.isArray(invoiceItems)) {
      throw new Error('Invoices and invoiceItems must be arrays');
    }

    // Sync invoices
    const invoiceOps = invoices.map((item) => {
      const {
        id, invoiceNumber, invoiceDate, dueDate, clientId, subtotal,
        discount, tax, shipping, adjustment, total, notes, signature, 
        attachments, status, createdAt, updatedAt, deleted
      } = item;

      return {
        updateOne: {
          filter: { id, userEmail },
          update: {
            $set: {
              id, invoiceNumber, invoiceDate: new Date(invoiceDate), 
              dueDate: new Date(dueDate), clientId, subtotal,
              discount, tax, shipping, adjustment, total, notes, 
              signature, attachments, status, 
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

    if (invoiceOps.length > 0) {
      await getInvoicesCollection().bulkWrite(invoiceOps);
    }

    // Sync invoice items
    const itemOps = invoiceItems.map((item) => {
      const {
        id, invoiceId, productId, qty, rate, discount, 
        discountType, description, updatedAt, deleted
      } = item;

      return {
        updateOne: {
          filter: { id, userEmail },
          update: {
            $set: {
              id, invoiceId, productId, qty, rate, discount,
              discountType, description, updatedAt: new Date(updatedAt),
              deleted, userEmail, synced: 0
            }
          },
          upsert: true
        }
      };
    });

    if (itemOps.length > 0) {
      await getInvoiceItemsCollection().bulkWrite(itemOps);
    }

    // Return fresh data
    const [freshInvoices, freshItems] = await Promise.all([
      this.findByUserEmail(userEmail),
      InvoiceItem.findByUserEmail(userEmail)
    ]);

    return { invoices: freshInvoices, invoiceItems: freshItems };
  }
}

class InvoiceItem {
  // Create new invoice item
  static async create(data) {
    const errors = validateInvoiceItem(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const item = {
      ...data,
      synced: 0,
      deleted: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await getInvoiceItemsCollection().insertOne(item);
    return { ...item, _id: result.insertedId };
  }

  // Find all items by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    return await getInvoiceItemsCollection().find(filter).toArray();
  }

  // Find items by invoice ID
  static async findByInvoiceId(invoiceId, userEmail) {
    return await getInvoiceItemsCollection().find({ 
      invoiceId, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Find item by ID and user email
  static async findById(id, userEmail) {
    return await getInvoiceItemsCollection().findOne({ id, userEmail, deleted: 0 });
  }

  // Update invoice item
  static async update(id, userEmail, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0
    };

    const result = await getInvoiceItemsCollection().updateOne(
      { id, userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('Invoice item not found or no permission');
    }

    return result;
  }

  // Soft delete invoice item
  static async delete(id, userEmail) {
    const result = await getInvoiceItemsCollection().updateOne(
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
      throw new Error('Invoice item not found or no permission');
    }

    return result;
  }
}

module.exports = {
  Invoice,
  InvoiceItem,
  invoiceSchema,
  invoiceItemSchema,
  validateInvoice,
  validateInvoiceItem
};
