const { getCommissionAgentsCollection } = require('../config/database');

// Commission Agent Schema
const commissionAgentSchema = {
  id: { type: String, required: true }, // UUID
  userEmail: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  contactNo: { type: String, default: '' },
  commissionAmount: { type: Number, default: 0 },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Validation function
const validateCommissionAgent = (data) => {
  const errors = [];
  
  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.name) errors.push('name is required');
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  // Commission amount validation
  if (data.commissionAmount && data.commissionAmount < 0) {
    errors.push('commissionAmount cannot be negative');
  }
  
  return errors;
};

class CommissionAgent {
  // Create new commission agent
  static async create(data) {
    const errors = validateCommissionAgent(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const agent = {
      ...data,
      synced: 0,
      deleted: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const collection = getCommissionAgentsCollection();
    const result = await collection.insertOne(agent);
    return { ...agent, _id: result.insertedId };
  }

  // Find all commission agents by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    const collection = getCommissionAgentsCollection();
    return await collection.find(filter).toArray();
  }

  // Find commission agent by ID and user email
  static async findById(id, userEmail) {
    const collection = getCommissionAgentsCollection();
    return await collection.findOne({ id, userEmail, deleted: 0 });
  }

  // Find commission agent by name
  static async findByName(name, userEmail) {
    const collection = getCommissionAgentsCollection();
    return await collection.find({ 
      name: { $regex: name, $options: 'i' }, 
      userEmail, 
      deleted: 0 
    }).toArray();
  }

  // Update commission agent
  static async update(id, userEmail, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0
    };

    const collection = getCommissionAgentsCollection();
    const result = await collection.updateOne(
      { id, userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('Commission agent not found or no permission');
    }

    return result;
  }

  // Soft delete commission agent
  static async delete(id, userEmail) {
    const collection = getCommissionAgentsCollection();
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
      throw new Error('Commission agent not found or no permission');
    }

    return result;
  }

  // Sync commission agents
  static async sync(userEmail, agents) {
    if (!Array.isArray(agents)) {
      throw new Error('Commission agents must be an array');
    }

    const bulkOps = agents.map((item) => {
      const {
        id,
        name,
        email,
        address,
        contactNo,
        commissionAmount,
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
              name,
              email,
              address,
              contactNo,
              commissionAmount,
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

    const collection = getCommissionAgentsCollection();
    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
    }

    return await this.findByUserEmail(userEmail);
  }

  // Get unsynced commission agents
  static async getUnsynced(userEmail) {
    const collection = getCommissionAgentsCollection();
    return await collection.find({ 
      userEmail, 
      synced: 0 
    }).toArray();
  }

  // Mark as synced
  static async markAsSynced(ids, userEmail) {
    if (ids.length === 0) return;
    
    const collection = getCommissionAgentsCollection();
    await collection.updateMany(
      { id: { $in: ids }, userEmail },
      { $set: { synced: 1 } }
    );
  }

  // Get total commission amount for an agent
  static async getTotalCommission(agentId, userEmail) {
    const collection = getCommissionAgentsCollection();
    const agent = await collection.findOne({ id: agentId, userEmail, deleted: 0 });
    return agent ? agent.commissionAmount : 0;
  }

  // Update commission amount
  static async updateCommissionAmount(id, userEmail, newAmount) {
    if (newAmount < 0) {
      throw new Error('Commission amount cannot be negative');
    }

    const collection = getCommissionAgentsCollection();
    const result = await collection.updateOne(
      { id, userEmail },
      { 
        $set: { 
          commissionAmount: newAmount,
          updatedAt: new Date(),
          synced: 0 
        } 
      }
    );

    if (result.matchedCount === 0) {
      throw new Error('Commission agent not found or no permission');
    }

    return result;
  }
}

module.exports = {
  CommissionAgent,
  commissionAgentSchema,
  validateCommissionAgent
};
