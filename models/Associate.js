const { getAssociatesCollection } = require('../config/database');

// Associate Schema
const associateSchema = {
  id: { type: String, required: true }, // UUID
  userEmail: { type: String, required: true },
  organizationName: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, default: '' },
  contact: { type: String, default: '' },
  openingBalance: { type: Number, default: 0 },
  clientName: { type: String, default: '' },
  supplierName: { type: String, default: '' },
  shippingAddress: { type: String, default: '' },
  taxId: { type: String, default: '' },
  businessDetail: { type: String, default: '' },
  associateType: { type: String, enum: ['client', 'supplier', 'both'], default: 'client' },
  unpaidCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Validation function
const validateAssociate = (data) => {
  const errors = [];
  
  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.organizationName) errors.push('organizationName is required');
  if (!data.email) errors.push('email is required');
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  // Associate type validation
  if (data.associateType && !['client', 'supplier', 'both'].includes(data.associateType)) {
    errors.push('associateType must be client, supplier, or both');
  }
  
  return errors;
};

class Associate {
  // Create new associate
  static async create(data) {
    const errors = validateAssociate(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const associate = {
      ...data,
      synced: 0,
      deleted: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const collection = getAssociatesCollection();
    const result = await collection.insertOne(associate);
    return { ...associate, _id: result.insertedId };
  }

  // Find all associates by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    const collection = getAssociatesCollection();
    return await collection.find(filter).toArray();
  }

  // Find associate by ID and user email
  static async findById(id, userEmail) {
    const collection = getAssociatesCollection();
    return await collection.findOne({ id, userEmail, deleted: 0 });
  }

  // Update associate
  static async update(id, userEmail, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0
    };

    const collection = getAssociatesCollection();
    const result = await collection.updateOne(
      { id, userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('Associate not found or no permission');
    }

    return result;
  }

  // Soft delete associate
  static async delete(id, userEmail) {
    const collection = getAssociatesCollection();
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
      throw new Error('Associate not found or no permission');
    }

    return result;
  }

  // Sync associates
  static async sync(userEmail, associates) {
    if (!Array.isArray(associates)) {
      throw new Error('Associates must be an array');
    }

    const bulkOps = associates.map((item) => {
      const {
        createdAt,
        id,
        organizationName,
        email,
        address,
        contact,
        openingBalance,
        clientName,
        supplierName,
        shippingAddress,
        taxId,
        businessDetail,
        associateType,
        unpaidCount,
        totalCount,
        balance,
        deleted,
        updatedAt = new Date()
      } = item;

      return {
        updateOne: {
          filter: { id, userEmail },
          update: {
            $set: {
              id,
              organizationName,
              email,
              address,
              contact,
              openingBalance,
              clientName,
              supplierName,
              shippingAddress,
              taxId,
              businessDetail,
              associateType,
              unpaidCount,
              totalCount,
              balance,
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

    const collection = getAssociatesCollection();
    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
    }

    return await this.findByUserEmail(userEmail);
  }

  // Get unsynced associates
  static async getUnsynced(userEmail) {
    const collection = getAssociatesCollection();
    return await collection.find({ 
      userEmail, 
      synced: 0 
    }).toArray();
  }

  // Mark as synced
  static async markAsSynced(ids, userEmail) {
    if (ids.length === 0) return;
    
    const collection = getAssociatesCollection();
    await collection.updateMany(
      { id: { $in: ids }, userEmail },
      { $set: { synced: 1 } }
    );
  }
}

module.exports = {
  Associate,
  associateSchema,
  validateAssociate
};
