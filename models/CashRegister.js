const { getCashRegistersCollection } = require("../config/database");

// Cash Register Schema Definition
const cashRegisterSchema = {
  id: { type: String, required: true },
  userEmail: { type: String, required: true },
  openingAmount: { type: Number, default: 0 },
  openingTime: { type: Date, required: true },
  openedBy: { type: String, required: true },
  closingAmount: { type: Number, default: null },
  closingTime: { type: Date, default: null },
  closedBy: { type: String, default: null },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};

// Validation function
const validateCashRegister = (cashRegister) => {
  const errors = [];

  if (!cashRegister.id) {
    errors.push("ID is required");
  }
  if (!cashRegister.userEmail) {
    errors.push("User email is required");
  }
  if (!cashRegister.openingTime) {
    errors.push("Opening time is required");
  }
  if (!cashRegister.openedBy) {
    errors.push("Opened by is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// CashRegister class with static methods
class CashRegister {
  /**
   * Find all cash registers for a user
   */
  static async findByUserEmail(userEmail) {
    try {
      const collection = getCashRegistersCollection();
      const cashRegisters = await collection
        .find({ userEmail })
        .project({ userEmail: 0 })
        .toArray();
      return cashRegisters;
    } catch (error) {
      console.error("Error finding cash registers:", error);
      throw error;
    }
  }

  /**
   * Find a cash register by ID
   */
  static async findById(userEmail, id) {
    try {
      const collection = getCashRegistersCollection();
      const cashRegister = await collection
        .findOne({ id, userEmail })
        .project({ userEmail: 0 });
      return cashRegister;
    } catch (error) {
      console.error("Error finding cash register by ID:", error);
      throw error;
    }
  }

  /**
   * Sync cash registers from client to server
   */
  static async sync(userEmail, cashRegisters) {
    try {
      const collection = getCashRegistersCollection();

      // === 🔁 Sync Cash Registers ===
      const operations = cashRegisters.map((register) => {
        const filter = { id: register.id, userEmail };
        const {
          id,
          openingAmount,
          openingTime,
          openedBy,
          closingAmount,
          closingTime,
          closedBy,
          createdAt,
          updatedAt,
          deleted,
        } = register;

        return {
          updateOne: {
            filter,
            update: {
              $set: {
                id,
                openingAmount: openingAmount || 0,
                openingTime: openingTime ? new Date(openingTime) : new Date(),
                openedBy,
                closingAmount: closingAmount || null,
                closingTime: closingTime ? new Date(closingTime) : null,
                closedBy: closedBy || null,
                updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
                deleted: deleted || 0,
                userEmail,
                synced: 0,
              },
            },
            $setOnInsert: {
              createdAt: createdAt ? new Date(createdAt) : new Date(),
            },
            upsert: true,
          },
        };
      });

      if (operations.length > 0) {
        await collection.bulkWrite(operations);
      }

      // === ✅ Return fresh data
      return {
        cashRegisters: await this.findByUserEmail(userEmail),
      };
    } catch (error) {
      console.error("Error syncing cash registers:", error);
      throw error;
    }
  }

  /**
   * Create a new cash register
   */
  static async create(userEmail, cashRegisterData) {
    try {
      const validation = validateCashRegister(cashRegisterData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      const collection = getCashRegistersCollection();
      const newCashRegister = {
        ...cashRegisterData,
        userEmail,
        synced: 0,
        deleted: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await collection.insertOne(newCashRegister);
      const { userEmail: _, ...result } = newCashRegister;
      return result;
    } catch (error) {
      console.error("Error creating cash register:", error);
      throw error;
    }
  }

  /**
   * Update a cash register
   */
  static async update(userEmail, id, updates) {
    try {
      const collection = getCashRegistersCollection();
      const result = await collection.findOneAndUpdate(
        { id, userEmail },
        {
          $set: {
            ...updates,
            updatedAt: new Date(),
            synced: 0,
          },
        },
        { returnDocument: "after" }
      );

      if (!result.value) {
        throw new Error("Cash register not found");
      }

      const { userEmail: _, ...cashRegister } = result.value;
      return cashRegister;
    } catch (error) {
      console.error("Error updating cash register:", error);
      throw error;
    }
  }

  /**
   * Soft delete a cash register
   */
  static async delete(userEmail, id) {
    try {
      const collection = getCashRegistersCollection();
      const result = await collection.findOneAndUpdate(
        { id, userEmail },
        {
          $set: {
            deleted: 1,
            updatedAt: new Date(),
            synced: 0,
          },
        },
        { returnDocument: "after" }
      );

      if (!result.value) {
        throw new Error("Cash register not found");
      }

      return { success: true };
    } catch (error) {
      console.error("Error deleting cash register:", error);
      throw error;
    }
  }
}

module.exports = {
  CashRegister,
  cashRegisterSchema,
  validateCashRegister,
};
