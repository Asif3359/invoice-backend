const {
  getPurchaseOrdersCollection,
  getPurchaseOrderItemsCollection,
  getPurchaseOrderPaymentsCollection,
} = require("../config/database");

// sync purchase orders
const syncPurchaseOrders = async (req, res) => {
  try {
    const {
      userEmail,
      purchaseOrders,
      purchaseOrderItems,
      purchaseOrderPayments,
    } = req.body;

    if (
      !userEmail ||
      !Array.isArray(purchaseOrders) ||
      !Array.isArray(purchaseOrderItems) ||
      !Array.isArray(purchaseOrderPayments)
    ) {
      return res.status(400).send("Missing userEmail or invalid data");
    }

    const purchaseOrdersCollection = getPurchaseOrdersCollection();
    const purchaseOrderItemsCollection = getPurchaseOrderItemsCollection();
    const purchaseOrderPaymentsCollection =
      getPurchaseOrderPaymentsCollection();

    // === 🔁 Sync Purchase Orders ===
    const purchaseOrderOps = purchaseOrders.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id,
        purchaseOrderNumber,
        purchaseOrderRef,
        purchaseOrderDate,
        dueDate,
        purchaseOrderNote,
        supplierId,
        subtotal,
        discount,
        discountType,
        discountValue,
        tax,
        taxType,
        taxValue,
        taxEnabled,
        shipping,
        adjustment,
        adjustmentType,
        adjustedTotal,
        grandTotal,
        notes,
        signature,
        formState,
        status,
        createdAt,
        updatedAt,
        deleted,
      } = item;

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              id,
              purchaseOrderNumber,
              purchaseOrderRef,
              purchaseOrderDate,
              dueDate,
              purchaseOrderNote,
              supplierId,
              subtotal,
              discount,
              discountType,
              discountValue,
              tax,
              taxType,
              taxValue,
              taxEnabled,
              shipping,
              adjustment,
              adjustmentType,
              adjustedTotal,
              grandTotal,
              notes,
              signature,
              formState,
              status,
              updatedAt: new Date(updatedAt),
              deleted,
              userEmail,
              synced: 0,
            },
            $setOnInsert: {
              createdAt: createdAt ? new Date(createdAt) : new Date(),
            },
          },
          upsert: true,
        },
      };
    });

    if (purchaseOrderOps.length > 0) {
      await purchaseOrdersCollection.bulkWrite(purchaseOrderOps);
    }

    // === 🔁 Sync Purchase Order Items ===
    const itemOps = purchaseOrderItems.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id,
        purchaseOrderId,
        productId,
        productName,
        quantity,
        rate,
        total,
        category,
        description,
        productCode,
        unit,
        barcode,
        warehouseId,
        warehouseName,
        warehouseLocation,
        updatedAt,
        deleted,
      } = item;

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              id,
              purchaseOrderId,
              productId,
              productName,
              quantity,
              rate,
              total,
              category,
              description,
              productCode,
              unit,
              barcode,
              warehouseId,
              warehouseName,
              warehouseLocation,
              updatedAt: new Date(updatedAt),
              deleted,
              userEmail,
              synced: 0,
            },
          },
          upsert: true,
        },
      };
    });

    if (itemOps.length > 0) {
      await purchaseOrderItemsCollection.bulkWrite(itemOps);
    }

    // === 🔁 Sync Purchase Order Payments ===
    const paymentOps = purchaseOrderPayments.map((item) => {
      const filter = { id: item.id, userEmail };
      const {
        id,
        purchaseOrderId,
        amount,
        method,
        date,
        note,
        createdAt,
        updatedAt,
        deleted,
      } = item;

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              id,
              purchaseOrderId,
              amount,
              method,
              date: new Date(date),
              note,
              updatedAt: new Date(updatedAt),
              deleted,
              userEmail,
              synced: 0,
            },
            $setOnInsert: {
              createdAt: createdAt ? new Date(createdAt) : new Date(),
            },
          },
          upsert: true,
        },
      };
    });

    if (paymentOps.length > 0) {
      await purchaseOrderPaymentsCollection.bulkWrite(paymentOps);
    }

    // === ✅ Return all fresh data
    const [freshPurchaseOrders, freshItems, freshPayments] = await Promise.all([
      purchaseOrdersCollection
        .find({ userEmail })
        .project({ userEmail: 0 })
        .toArray(),
      purchaseOrderItemsCollection
        .find({ userEmail })
        .project({ userEmail: 0 })
        .toArray(),
      purchaseOrderPaymentsCollection
        .find({ userEmail })
        .project({ userEmail: 0 })
        .toArray(),
    ]);

    res.send({
      success: true,
      purchaseOrders: freshPurchaseOrders,
      purchaseOrderItems: freshItems,
      purchaseOrderPayments: freshPayments,
    });
  } catch (error) {
    console.error("❌ Purchase order sync error:", error);
    res.status(500).send("Error syncing purchase orders");
  }
};

module.exports = {
  syncPurchaseOrders,
};
