const { getInvoicesCollection, getInvoiceItemsCollection } = require('../config/database');

// sync invoices
const syncInvoices = async (req, res) => {
  try {
    const { userEmail, invoices, invoiceItems } = req.body;

    if (!userEmail || !Array.isArray(invoices) || !Array.isArray(invoiceItems)) {
      return res.status(400).send("Missing userEmail or invalid data");
    }

    const invoicesCollection = getInvoicesCollection();
    const invoiceItemsCollection = getInvoiceItemsCollection();

    // === 🔁 Sync Invoices ===
    const invoiceOps = invoices.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id,
        invoiceNumber,
        invoiceDate,
        dueDate,
        clientId,
        subtotal,
        discount,
        tax,
        shipping,
        adjustment,
        total,
        notes,
        signature,
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
              invoiceNumber,
              invoiceDate,
              dueDate,
              clientId,
              subtotal,
              discount,
              tax,
              shipping,
              adjustment,
              total,
              notes,
              signature,
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

    if (invoiceOps.length > 0) {
      await invoicesCollection.bulkWrite(invoiceOps);
    }

    // === 🔁 Sync Invoice Items ===
    const itemOps = invoiceItems.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id,
        invoiceId,
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
              invoiceId,
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
      await invoiceItemsCollection.bulkWrite(itemOps);
    }

    // === ✅ Send back all latest data
    const [freshInvoices, freshItems] = await Promise.all([
      invoicesCollection.find({ userEmail }).project({ userEmail: 0 }).toArray(),
      invoiceItemsCollection.find({ userEmail }).project({ userEmail: 0 }).toArray()
    ]);

    res.send({
      success: true,
      invoices: freshInvoices,
      invoiceItems: freshItems
    });

  } catch (error) {
    console.error("❌ Invoice sync error:", error);
    res.status(500).send("Error syncing invoices");
  }
};

module.exports = {
  syncInvoices
};
