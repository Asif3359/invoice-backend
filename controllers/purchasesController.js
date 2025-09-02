const { getPurchasesCollection, getPurchaseItemsCollection, getPurchasePaymentsCollection } = require('../config/database');

// sync purchases
const syncPurchases = async (req, res) => {
  try {
    const { userEmail, purchases, purchaseItems, purchasePayments } = req.body;

    if (!userEmail || !Array.isArray(purchases) || !Array.isArray(purchaseItems) || !Array.isArray(purchasePayments)) {
      return res.status(400).send("Missing userEmail or invalid data");
    }

    const purchasesCollection = getPurchasesCollection();
    const purchaseItemsCollection = getPurchaseItemsCollection();
    const purchasePaymentsCollection = getPurchasePaymentsCollection();

    // === 🔁 Sync Purchases ===
    const purchaseOps = purchases.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id, purchaseNumber, purchaseDate, dueDate, supplierId, subtotal,
        discount, tax, shipping, adjustment, total, notes, attachments,
        status, createdAt, updatedAt, deleted
      } = item;

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              id, purchaseNumber, purchaseDate, dueDate, supplierId, subtotal,
              discount, tax, shipping, adjustment, total, notes, attachments,
              status, updatedAt: new Date(updatedAt), deleted,
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

    if (purchaseOps.length > 0) {
      await purchasesCollection.bulkWrite(purchaseOps);
    }

    // === 🔁 Sync Purchase Items ===
    const itemOps = purchaseItems.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id, purchaseId, productId, qty, rate,
        discount, discountType, description, updatedAt, deleted
      } = item;

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              id, purchaseId, productId, qty, rate,
              discount, discountType, description,
              updatedAt: new Date(updatedAt), deleted,
              userEmail, synced: 0
            }
          },
          upsert: true
        }
      };
    });

    if (itemOps.length > 0) {
      await purchaseItemsCollection.bulkWrite(itemOps);
    }

    // === 🔁 Sync Purchase Payments ===
    const paymentOps = purchasePayments.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id, purchaseId, method, amount, note,
        paidAt, updatedAt, deleted
      } = item;

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              id, purchaseId, method, amount, note,
              paidAt: new Date(paidAt),
              updatedAt: new Date(updatedAt), deleted,
              userEmail, synced: 0
            }
          },
          upsert: true
        }
      };
    });

    if (paymentOps.length > 0) {
      await purchasePaymentsCollection.bulkWrite(paymentOps);
    }

    // === ✅ Return all fresh data
    const [freshPurchases, freshItems, freshPayments] = await Promise.all([
      purchasesCollection.find({ userEmail }).project({ userEmail: 0 }).toArray(),
      purchaseItemsCollection.find({ userEmail }).project({ userEmail: 0 }).toArray(),
      purchasePaymentsCollection.find({ userEmail }).project({ userEmail: 0 }).toArray()
    ]);

    res.send({
      success: true,
      purchases: freshPurchases,
      purchaseItems: freshItems,
      purchasePayments: freshPayments
    });

  } catch (error) {
    console.error("❌ Purchase sync error:", error);
    res.status(500).send("Error syncing purchases");
  }
};

module.exports = {
  syncPurchases
};
