const {
  getPurchaseOrdersCollection,
  getPurchaseOrderItemsCollection,
  getPurchaseOrderPaymentsCollection,
} = require("../config/database");

// Purchase Order Schema
const purchaseOrderSchema = {
  id: { type: String, required: true },
  userEmail: { type: String, required: true },
  purchaseOrderNumber: { type: String, required: true },
  purchaseOrderRef: { type: String, default: "" },
  purchaseOrderDate: { type: Date, required: true },
  dueDate: { type: Date, default: null },
  purchaseOrderNote: { type: String, default: "" },
  supplierId: { type: String, required: true },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountType: { type: String, default: "" },
  discountValue: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  taxType: { type: String, default: "" },
  taxValue: { type: Number, default: 0 },
  taxEnabled: { type: Number, default: 0 }, // 0 or 1
  shipping: { type: Number, default: 0 },
  adjustment: { type: Number, default: 0 },
  adjustmentType: { type: String, default: "" },
  adjustedTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  signature: { type: String, default: "" },
  formState: { type: String, default: "" },
  status: {
    type: String,
    enum: ["draft", "request", "pending", "complete", "cancelled"],
    default: "draft",
  },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};

// Purchase Order Item Schema
const purchaseOrderItemSchema = {
  id: { type: String, required: true },
  userEmail: { type: String, required: true },
  purchaseOrderId: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  total: { type: Number, required: true },
  category: { type: String, default: "" },
  description: { type: String, default: "" },
  productCode: { type: String, default: "" },
  unit: { type: String, default: "" },
  barcode: { type: String, default: "" },
  warehouseId: { type: String, default: "" },
  warehouseName: { type: String, default: "" },
  warehouseLocation: { type: String, default: "" },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
};

// Purchase Order Payment Schema
const purchaseOrderPaymentSchema = {
  id: { type: String, required: true },
  userEmail: { type: String, required: true },
  purchaseOrderId: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, default: "" },
  date: { type: Date, required: true },
  note: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  synced: { type: Number, default: 0 },
  deleted: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
};

// Validation function for Purchase Order
const validatePurchaseOrder = (data) => {
  const errors = [];

  if (!data.id) errors.push("id is required");
  if (!data.userEmail) errors.push("userEmail is required");
  if (!data.purchaseOrderNumber)
    errors.push("purchaseOrderNumber is required");
  if (!data.supplierId) errors.push("supplierId is required");

  // Date validations
  if (
    data.purchaseOrderDate &&
    isNaN(new Date(data.purchaseOrderDate).getTime())
  ) {
    errors.push("Invalid purchaseOrderDate format");
  }

  if (data.dueDate && isNaN(new Date(data.dueDate).getTime())) {
    errors.push("Invalid dueDate format");
  }

  // Numeric validations
  if (data.subtotal && data.subtotal < 0)
    errors.push("subtotal cannot be negative");
  if (data.discount && data.discount < 0)
    errors.push("discount cannot be negative");
  if (data.tax && data.tax < 0) errors.push("tax cannot be negative");
  if (data.shipping && data.shipping < 0)
    errors.push("shipping cannot be negative");
  if (data.grandTotal && data.grandTotal < 0)
    errors.push("grandTotal cannot be negative");

  // Status validation
  if (
    data.status &&
    !["draft", "request", "pending", "complete", "cancelled"].includes(
      data.status
    )
  ) {
    errors.push(
      "status must be one of: draft, request, pending, complete, cancelled"
    );
  }

  return errors;
};

// Validation function for Purchase Order Item
const validatePurchaseOrderItem = (data) => {
  const errors = [];

  if (!data.id) errors.push("id is required");
  if (!data.userEmail) errors.push("userEmail is required");
  if (!data.purchaseOrderId) errors.push("purchaseOrderId is required");
  if (!data.productId) errors.push("productId is required");
  if (!data.productName) errors.push("productName is required");
  if (!data.quantity && data.quantity !== 0)
    errors.push("quantity is required");
  if (!data.rate && data.rate !== 0) errors.push("rate is required");
  if (!data.total && data.total !== 0) errors.push("total is required");

  // Numeric validations
  if (data.quantity && data.quantity < 0)
    errors.push("quantity cannot be negative");
  if (data.rate && data.rate < 0) errors.push("rate cannot be negative");
  if (data.total && data.total < 0) errors.push("total cannot be negative");

  return errors;
};

// Validation function for Purchase Order Payment
const validatePurchaseOrderPayment = (data) => {
  const errors = [];

  if (!data.id) errors.push("id is required");
  if (!data.userEmail) errors.push("userEmail is required");
  if (!data.purchaseOrderId) errors.push("purchaseOrderId is required");
  if (!data.amount && data.amount !== 0) errors.push("amount is required");
  if (!data.date) errors.push("date is required");

  // Numeric validations
  if (data.amount && data.amount < 0) errors.push("amount cannot be negative");

  // Date validation
  if (data.date && isNaN(new Date(data.date).getTime())) {
    errors.push("Invalid date format");
  }

  return errors;
};

class PurchaseOrder {
  // Create new purchase order
  static async create(data) {
    const errors = validatePurchaseOrder(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    const purchaseOrder = {
      ...data,
      purchaseOrderDate: new Date(data.purchaseOrderDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      synced: 0,
      deleted: 0,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: new Date(),
    };

    const result = await getPurchaseOrdersCollection().insertOne(purchaseOrder);
    return { ...purchaseOrder, _id: result.insertedId };
  }

  // Find all purchase orders by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;

    return await getPurchaseOrdersCollection().find(filter).toArray();
  }

  // Find purchase order by ID and user email
  static async findById(id, userEmail) {
    return await getPurchaseOrdersCollection().findOne({
      id,
      userEmail,
      deleted: 0,
    });
  }

  // Update purchase order
  static async update(id, userEmail, data) {
    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0,
    };

    if (data.purchaseOrderDate) {
      updateData.purchaseOrderDate = new Date(data.purchaseOrderDate);
    }
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    const result = await getPurchaseOrdersCollection().updateOne(
      { id, userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error("Purchase order not found or no permission");
    }

    return result;
  }

  // Soft delete purchase order
  static async delete(id, userEmail) {
    const result = await getPurchaseOrdersCollection().updateOne(
      { id, userEmail },
      {
        $set: {
          deleted: 1,
          updatedAt: new Date(),
          synced: 0,
        },
      }
    );

    if (result.matchedCount === 0) {
      throw new Error("Purchase order not found or no permission");
    }

    return result;
  }

  // Sync purchase orders
  static async sync(
    userEmail,
    purchaseOrders,
    purchaseOrderItems,
    purchaseOrderPayments
  ) {
    if (
      !Array.isArray(purchaseOrders) ||
      !Array.isArray(purchaseOrderItems) ||
      !Array.isArray(purchaseOrderPayments)
    ) {
      throw new Error(
        "purchaseOrders, purchaseOrderItems, and purchaseOrderPayments must be arrays"
      );
    }

    // Sync purchase orders
    const purchaseOrderOps = purchaseOrders.map((item) => {
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
          filter: { id, userEmail },
          update: {
            $set: {
              id,
              purchaseOrderNumber,
              purchaseOrderRef: purchaseOrderRef || "",
              purchaseOrderDate: new Date(purchaseOrderDate),
              dueDate: dueDate ? new Date(dueDate) : null,
              purchaseOrderNote: purchaseOrderNote || "",
              supplierId,
              subtotal: subtotal || 0,
              discount: discount || 0,
              discountType: discountType || "",
              discountValue: discountValue || 0,
              tax: tax || 0,
              taxType: taxType || "",
              taxValue: taxValue || 0,
              taxEnabled: taxEnabled || 0,
              shipping: shipping || 0,
              adjustment: adjustment || 0,
              adjustmentType: adjustmentType || "",
              adjustedTotal: adjustedTotal || 0,
              grandTotal: grandTotal || 0,
              notes: notes || "",
              signature: signature || "",
              formState: formState || "",
              status: status || "draft",
              updatedAt: new Date(updatedAt),
              deleted: deleted || 0,
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
      await getPurchaseOrdersCollection().bulkWrite(purchaseOrderOps);
    }

    // Sync purchase order items
    const itemOps = purchaseOrderItems.map((item) => {
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
          filter: { id, userEmail },
          update: {
            $set: {
              id,
              purchaseOrderId,
              productId,
              productName,
              quantity: quantity || 0,
              rate: rate || 0,
              total: total || 0,
              category: category || "",
              description: description || "",
              productCode: productCode || "",
              unit: unit || "",
              barcode: barcode || "",
              warehouseId: warehouseId || "",
              warehouseName: warehouseName || "",
              warehouseLocation: warehouseLocation || "",
              updatedAt: new Date(updatedAt),
              deleted: deleted || 0,
              userEmail,
              synced: 0,
            },
          },
          upsert: true,
        },
      };
    });

    if (itemOps.length > 0) {
      await getPurchaseOrderItemsCollection().bulkWrite(itemOps);
    }

    // Sync purchase order payments
    const paymentOps = purchaseOrderPayments.map((item) => {
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
          filter: { id, userEmail },
          update: {
            $set: {
              id,
              purchaseOrderId,
              amount: amount || 0,
              method: method || "",
              date: new Date(date),
              note: note || "",
              updatedAt: new Date(updatedAt),
              deleted: deleted || 0,
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
      await getPurchaseOrderPaymentsCollection().bulkWrite(paymentOps);
    }

    // Return fresh data
    const [freshPurchaseOrders, freshItems, freshPayments] = await Promise.all([
      this.findByUserEmail(userEmail),
      PurchaseOrderItem.findByUserEmail(userEmail),
      PurchaseOrderPayment.findByUserEmail(userEmail),
    ]);

    return {
      purchaseOrders: freshPurchaseOrders,
      purchaseOrderItems: freshItems,
      purchaseOrderPayments: freshPayments,
    };
  }
}

class PurchaseOrderItem {
  // Find all items by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;

    return await getPurchaseOrderItemsCollection().find(filter).toArray();
  }

  // Find items by purchase order ID
  static async findByPurchaseOrderId(purchaseOrderId, userEmail) {
    return await getPurchaseOrderItemsCollection()
      .find({
        purchaseOrderId,
        userEmail,
        deleted: 0,
      })
      .toArray();
  }

  // Create new purchase order item
  static async create(data) {
    const errors = validatePurchaseOrderItem(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    const item = {
      ...data,
      synced: 0,
      deleted: 0,
      updatedAt: new Date(),
    };

    const result = await getPurchaseOrderItemsCollection().insertOne(item);
    return { ...item, _id: result.insertedId };
  }

  // Delete items by purchase order ID
  static async deleteByPurchaseOrderId(purchaseOrderId, userEmail) {
    const result = await getPurchaseOrderItemsCollection().updateMany(
      { purchaseOrderId, userEmail },
      {
        $set: {
          deleted: 1,
          updatedAt: new Date(),
          synced: 0,
        },
      }
    );

    return result;
  }
}

class PurchaseOrderPayment {
  // Find all payments by user email
  static async findByUserEmail(userEmail, includeDeleted = false) {
    const filter = { userEmail };
    if (!includeDeleted) filter.deleted = 0;

    return await getPurchaseOrderPaymentsCollection().find(filter).toArray();
  }

  // Find payments by purchase order ID
  static async findByPurchaseOrderId(purchaseOrderId, userEmail) {
    return await getPurchaseOrderPaymentsCollection()
      .find({
        purchaseOrderId,
        userEmail,
        deleted: 0,
      })
      .toArray();
  }

  // Create new purchase order payment
  static async create(data) {
    const errors = validatePurchaseOrderPayment(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    const payment = {
      ...data,
      date: new Date(data.date),
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      synced: 0,
      deleted: 0,
      updatedAt: new Date(),
    };

    const result = await getPurchaseOrderPaymentsCollection().insertOne(
      payment
    );
    return { ...payment, _id: result.insertedId };
  }

  // Delete payments by purchase order ID
  static async deleteByPurchaseOrderId(purchaseOrderId, userEmail) {
    const result = await getPurchaseOrderPaymentsCollection().updateMany(
      { purchaseOrderId, userEmail },
      {
        $set: {
          deleted: 1,
          updatedAt: new Date(),
          synced: 0,
        },
      }
    );

    return result;
  }
}

module.exports = {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderPayment,
  purchaseOrderSchema,
  purchaseOrderItemSchema,
  purchaseOrderPaymentSchema,
  validatePurchaseOrder,
  validatePurchaseOrderItem,
  validatePurchaseOrderPayment,
};

