const { getExpensesCollection } = require('../config/database');

// ✅ Add Expense (POST /expenses)
const createExpense = async (req, res) => {
  try {
    // console.log("📥 Create expense request body:", JSON.stringify(req.body, null, 2));
    
    const { userEmail, data, expenses } = req.body;
    
    // Handle both single expense creation and sync format
    let expenseData;
    if (data) {
      // Single expense creation format: { userEmail, data }
      expenseData = data;
      console.log("📝 Using single expense format");
    } else if (expenses && Array.isArray(expenses) && expenses.length > 0) {
      // Sync format: { userEmail, expenses: [expense] }
      expenseData = expenses[0];
      // console.log("📝 Using sync format with", expenses.length, "expenses");
    } else {
      console.log("❌ Missing required fields. Body:", req.body);
      return res.status(400).send("Missing userEmail and data/expenses");
    }
    
    if (!userEmail) {
      console.log("❌ Missing userEmail");
      return res.status(400).send("Missing userEmail");
    }
    
    if (!expenseData.id) {
      console.log("❌ Missing id field in expense data:", expenseData);
      return res.status(400).send("Missing id field in expense data");
    }

    const expense = {
      ...expenseData,
      userEmail,
      date: new Date(expenseData.date),
      synced: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: 0
    };

    console.log("💾 Creating expense:", expense);
    const collection = getExpensesCollection();
    const result = await collection.insertOne(expense);
    console.log("✅ Inserted expense:", result.insertedId);
    res.status(201).send(result);
  } catch (error) {
    console.error("❌ Error creating expense:", error);
    res.status(500).send("Error creating expense");
  }
};

// ✅ Update Expense by UUID (PUT /expenses/:id)
const updateExpense = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail, data } = req.body;

    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");

    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0,
    };

    if (data.date) {
      updateData.date = new Date(data.date);
    }

    const collection = getExpensesCollection();
    const result = await collection.updateOne(
      { id: id, userEmail },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) return res.status(404).send("Expense not found or no permission");
    res.send({ success: true });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).send("Error updating expense");
  }
};

// ✅ Get All Expenses for a User (GET /expenses/:userEmail)
const getExpenses = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const collection = getExpensesCollection();
    const expenses = await collection.find({ userEmail, deleted: 0 }).sort({ createdAt: -1 }).toArray();
    res.send(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).send("Error fetching expenses");
  }
};

// ✅ Get Expense by ID (GET /expenses/:userEmail/:id)
const getExpenseById = async (req, res) => {
  try {
    const { userEmail, id } = req.params;
    const collection = getExpensesCollection();
    const expense = await collection.findOne({ id, userEmail, deleted: 0 });
    
    if (!expense) return res.status(404).send("Expense not found");
    res.send(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).send("Error fetching expense");
  }
};

// ✅ Soft Delete Expense (DELETE /expenses/:id)
const deleteExpense = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail } = req.body;

    if (!userEmail) return res.status(400).send("Missing userEmail");

    const collection = getExpensesCollection();
    const result = await collection.updateOne(
      { id: id, userEmail },
      {
        $set: {
          deleted: 1,
          updatedAt: new Date(),
          synced: 0
        }
      }
    );

    if (result.matchedCount === 0) return res.status(404).send("Expense not found or no permission");
    res.send({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).send("Error deleting expense");
  }
};

// ✅ Get Expenses by Date Range (GET /expenses/:userEmail/date-range)
const getExpensesByDateRange = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).send("Missing startDate or endDate query parameters");
    }

    const collection = getExpensesCollection();
    const expenses = await collection.find({
      userEmail,
      deleted: 0,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: -1 }).toArray();

    res.send(expenses);
  } catch (error) {
    console.error("Error fetching expenses by date range:", error);
    res.status(500).send("Error fetching expenses by date range");
  }
};

// ✅ Get Expenses by Category (GET /expenses/:userEmail/category/:category)
const getExpensesByCategory = async (req, res) => {
  try {
    const { userEmail, category } = req.params;
    const collection = getExpensesCollection();
    const expenses = await collection.find({
      userEmail,
      deleted: 0,
      expenseCategory: category
    }).sort({ date: -1 }).toArray();

    res.send(expenses);
  } catch (error) {
    console.error("Error fetching expenses by category:", error);
    res.status(500).send("Error fetching expenses by category");
  }
};

// ✅ Get Expenses by Type (GET /expenses/:userEmail/type/:type)
const getExpensesByType = async (req, res) => {
  try {
    const { userEmail, type } = req.params;
    const collection = getExpensesCollection();
    const expenses = await collection.find({
      userEmail,
      deleted: 0,
      expenseType: type
    }).sort({ date: -1 }).toArray();

    res.send(expenses);
  } catch (error) {
    console.error("Error fetching expenses by type:", error);
    res.status(500).send("Error fetching expenses by type");
  }
};

// ✅ Search Expenses (GET /expenses/:userEmail/search)
const searchExpenses = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { q: searchTerm } = req.query;

    if (!searchTerm) {
      return res.status(400).send("Missing search query parameter 'q'");
    }

    const regex = new RegExp(searchTerm, 'i');
    const collection = getExpensesCollection();
    const expenses = await collection.find({
      userEmail,
      deleted: 0,
      $or: [
        { expenseType: regex },
        { expenseCategory: regex },
        { note: regex },
        { expenseId: regex }
      ]
    }).sort({ date: -1 }).toArray();

    res.send(expenses);
  } catch (error) {
    console.error("Error searching expenses:", error);
    res.status(500).send("Error searching expenses");
  }
};

// ✅ Get Filtered Expenses (POST /expenses/:userEmail/filter)
const getFilteredExpenses = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const filters = req.body;

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

    const expenses = await collection.find(query).sort({ date: -1 }).toArray();
    res.send(expenses);
  } catch (error) {
    console.error("Error getting filtered expenses:", error);
    res.status(500).send("Error getting filtered expenses");
  }
};

// ✅ Get Expense Summary (GET /expenses/:userEmail/summary)
const getExpenseSummary = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { startDate, endDate } = req.query;

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
      return res.send({
        totalAmount: 0,
        totalCount: 0,
        categoryBreakdown: []
      });
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

    res.send({
      totalAmount: result[0].totalAmount,
      totalCount: result[0].totalCount,
      categoryBreakdown
    });
  } catch (error) {
    console.error("Error getting expense summary:", error);
    res.status(500).send("Error getting expense summary");
  }
};

// ✅ Get Unique Categories (GET /expenses/:userEmail/categories)
const getExpenseCategories = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const collection = getExpensesCollection();
    const categories = await collection.distinct('expenseCategory', {
      userEmail,
      deleted: 0,
      expenseCategory: { $ne: null, $ne: '' }
    });
    
    res.send(categories.filter(cat => cat));
  } catch (error) {
    console.error("Error getting expense categories:", error);
    res.status(500).send("Error getting expense categories");
  }
};

// ✅ Get Unique Expense Types (GET /expenses/:userEmail/types)
const getExpenseTypes = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const collection = getExpensesCollection();
    const types = await collection.distinct('expenseType', {
      userEmail,
      deleted: 0,
      expenseType: { $ne: null, $ne: '' }
    });
    
    res.send(types.filter(type => type));
  } catch (error) {
    console.error("Error getting expense types:", error);
    res.status(500).send("Error getting expense types");
  }
};

// ✅ Get Expenses by Month (GET /expenses/:userEmail/month/:year/:month)
const getExpensesByMonth = async (req, res) => {
  try {
    const { userEmail, year, month } = req.params;
    const collection = getExpensesCollection();
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

    const expenses = await collection.find({
      userEmail,
      deleted: 0,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 }).toArray();

    res.send(expenses);
  } catch (error) {
    console.error("Error getting expenses by month:", error);
    res.status(500).send("Error getting expenses by month");
  }
};

// ✅ Get Expenses by Year (GET /expenses/:userEmail/year/:year)
const getExpensesByYear = async (req, res) => {
  try {
    const { userEmail, year } = req.params;
    const collection = getExpensesCollection();
    const startDate = new Date(parseInt(year), 0, 1);
    const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);

    const expenses = await collection.find({
      userEmail,
      deleted: 0,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 }).toArray();

    res.send(expenses);
  } catch (error) {
    console.error("Error getting expenses by year:", error);
    res.status(500).send("Error getting expenses by year");
  }
};

// ✅ Get Recent Expenses (GET /expenses/:userEmail/recent)
const getRecentExpenses = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { days = 30 } = req.query;
    
    const collection = getExpensesCollection();
    const endDate = new Date();
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const expenses = await collection.find({
      userEmail,
      deleted: 0,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 }).toArray();

    res.send(expenses);
  } catch (error) {
    console.error("Error getting recent expenses:", error);
    res.status(500).send("Error getting recent expenses");
  }
};

// ✅ Sync Expenses (POST /expenses/sync)
const syncExpenses = async (req, res) => {
  try {
    const { userEmail, expenses } = req.body;
    if (!userEmail || !Array.isArray(expenses)) {
      return res.status(400).send("Missing userEmail or invalid expenses array");
    }

    const collection = getExpensesCollection();
    const bulkOps = expenses.map((item) => {
      const filter = { id: item.id, userEmail };
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
          filter,
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

    const freshData = await collection
      .find({ userEmail })
      .project({ userEmail: 0 }) // Optional
      .toArray();

    res.send({ success: true, data: freshData });

  } catch (error) {
    console.error("❌ Expense sync error:", error);
    res.status(500).send("Error syncing expenses");
  }
};

module.exports = {
  createExpense,
  updateExpense,
  getExpenses,
  getExpenseById,
  deleteExpense,
  getExpensesByDateRange,
  getExpensesByCategory,
  getExpensesByType,
  searchExpenses,
  getFilteredExpenses,
  getExpenseSummary,
  getExpenseCategories,
  getExpenseTypes,
  getExpensesByMonth,
  getExpensesByYear,
  getRecentExpenses,
  syncExpenses
};
