const { getExpensesCollection } = require('../config/database');

// Expense Schema
const expenseSchema = {
  id: { type: String, required: true }, // UUID
  userEmail: { type: String, required: true },
  expenseId: { type: String, default: '' },
  date: { type: Date, required: true },
  expenseType: { type: String, default: '' },
  expenseCategory: { type: String, default: '' },
  note: { type: String, default: '' },
  amount: { type: Number, required: true },
  extra: { type: String, default: '' },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
};

// Validation function
const validateExpense = (data) => {
  const errors = [];
  
  if (!data.id) errors.push('id is required');
  if (!data.userEmail) errors.push('userEmail is required');
  if (!data.date) errors.push('date is required');
  if (!data.amount) errors.push('amount is required');
  
  // Amount validation
  if (data.amount && data.amount <= 0) {
    errors.push('amount must be greater than 0');
  }
  
  // Date validation
  if (data.date && isNaN(new Date(data.date).getTime())) {
    errors.push('Invalid date format');
  }
  
  return errors;
};

class Expense {
  // Create new expense
  static async create(data) {
    const errors = validateExpense(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const expense = {
      ...data,
      date: new Date(data.date),
      synced: 0,
      deleted: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const collection = getExpensesCollection();
    const result = await collection.insertOne(expense);
    return { ...expense, _id: result.insertedId };
  }

  // Find all expenses by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;
    
    const collection = getExpensesCollection();
    return await collection.find(filter).sort({ createdAt: -1 }).toArray();
  }

  // Find expense by ID and user email
  static async findById(id, userEmail) {
    const collection = getExpensesCollection();
    return await collection.findOne({ id, userEmail, deleted: 0 });
  }

  // Update expense
  static async update(id, userEmail, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0
    };

    if (data.date) {
      updateData.date = new Date(data.date);
    }

    const collection = getExpensesCollection();
    const result = await collection.updateOne(
      { id, userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('Expense not found or no permission');
    }

    return result;
  }

  // Soft delete expense
  static async delete(id, userEmail) {
    const collection = getExpensesCollection();
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
      throw new Error('Expense not found or no permission');
    }

    return result;
  }

  // Sync expenses
  static async sync(userEmail, expenses) {
    if (!Array.isArray(expenses)) {
      throw new Error('Expenses must be an array');
    }

    const collection = getExpensesCollection();
    const bulkOps = expenses.map((item) => {
      const {
        id,
        expenseId,
        date,
        expenseType,
        expenseCategory,
        note,
        amount,
        extra,
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
              expenseId,
              date: new Date(date),
              expenseType,
              expenseCategory,
              note,
              amount,
              extra,
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

  // Get expenses by date range
  static async findByDateRange(userEmail, startDate, endDate) {
    const collection = getExpensesCollection();
    return await collection.find({
      userEmail,
      deleted: 0,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: -1 }).toArray();
  }

  // Get expenses by category
  static async findByCategory(userEmail, category) {
    const collection = getExpensesCollection();
    return await collection.find({
      userEmail,
      deleted: 0,
      expenseCategory: category
    }).sort({ date: -1 }).toArray();
  }

  // Get expenses by type
  static async findByType(userEmail, type) {
    const collection = getExpensesCollection();
    return await collection.find({
      userEmail,
      deleted: 0,
      expenseType: type
    }).sort({ date: -1 }).toArray();
  }

  // Search expenses
  static async search(userEmail, searchTerm) {
    const regex = new RegExp(searchTerm, 'i');
    const collection = getExpensesCollection();
    return await collection.find({
      userEmail,
      deleted: 0,
      $or: [
        { expenseType: regex },
        { expenseCategory: regex },
        { note: regex },
        { expenseId: regex }
      ]
    }).sort({ date: -1 }).toArray();
  }

  // Get filtered expenses with multiple criteria
  static async getFiltered(userEmail, filters) {
    const collection = getExpensesCollection();
    const query = { userEmail, deleted: 0 };

    if (filters.startDate && filters.endDate) {
      query.date = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    if (filters.category) {
      query.expenseCategory = filters.category;
    }

    if (filters.type) {
      query.expenseType = filters.type;
    }

    if (filters.searchTerm) {
      const regex = new RegExp(filters.searchTerm, 'i');
      query.$or = [
        { expenseType: regex },
        { expenseCategory: regex },
        { note: regex },
        { expenseId: regex }
      ];
    }

    return await collection.find(query).sort({ date: -1 }).toArray();
  }

  // Get expense summary by date range
  static async getSummary(userEmail, startDate, endDate) {
    const collection = getExpensesCollection();
    const matchQuery = { userEmail, deleted: 0 };

    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 },
          categoryBreakdown: {
            $push: {
              category: '$expenseCategory',
              amount: '$amount'
            }
          }
        }
      }
    ];

    const result = await collection.aggregate(pipeline).toArray();
    
    if (result.length === 0) {
      return {
        totalAmount: 0,
        totalCount: 0,
        categoryBreakdown: []
      };
    }

    // Process category breakdown
    const categoryMap = {};
    result[0].categoryBreakdown.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!categoryMap[category]) {
        categoryMap[category] = { amount: 0, count: 0 };
      }
      categoryMap[category].amount += item.amount;
      categoryMap[category].count += 1;
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count
    }));

    return {
      totalAmount: result[0].totalAmount,
      totalCount: result[0].totalCount,
      categoryBreakdown
    };
  }

  // Get unique categories
  static async getCategories(userEmail) {
    const collection = getExpensesCollection();
    const result = await collection.distinct('expenseCategory', {
      userEmail,
      deleted: 0,
      expenseCategory: { $ne: null, $ne: '' }
    });
    return result.filter(cat => cat);
  }

  // Get unique expense types
  static async getTypes(userEmail) {
    const collection = getExpensesCollection();
    const result = await collection.distinct('expenseType', {
      userEmail,
      deleted: 0,
      expenseType: { $ne: null, $ne: '' }
    });
    return result.filter(type => type);
  }

  // Get expenses for specific month/year
  static async findByMonth(userEmail, year, month) {
    const collection = getExpensesCollection();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return await collection.find({
      userEmail,
      deleted: 0,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 }).toArray();
  }

  // Get expenses for specific year
  static async findByYear(userEmail, year) {
    const collection = getExpensesCollection();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    return await collection.find({
      userEmail,
      deleted: 0,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 }).toArray();
  }

  // Get recent expenses (last N days)
  static async getRecent(userEmail, days = 30) {
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return await this.findByDateRange(userEmail, startDate, endDate);
  }

  // Get unsynced expenses
  static async getUnsynced(userEmail) {
    const collection = getExpensesCollection();
    return await collection.find({ 
      userEmail, 
      synced: 0 
    }).toArray();
  }

  // Mark as synced
  static async markAsSynced(ids, userEmail) {
    if (ids.length === 0) return;
    
    const collection = getExpensesCollection();
    await collection.updateMany(
      { id: { $in: ids }, userEmail },
      { $set: { synced: 1 } }
    );
  }

  // Upsert expense (insert or update)
  static async upsert(userEmail, data) {
    if (data.id) {
      // Update existing expense
      return await this.update(data.id, userEmail, data);
    } else {
      // Create new expense
      return await this.create({ ...data, userEmail });
    }
  }
}

module.exports = {
  Expense,
  expenseSchema,
  validateExpense
};
