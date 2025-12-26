require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const mongoose = require("mongoose");

// // MongoDB URI
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gdf4x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB URI
const uri = process.env.MONGO_URI;
// MongoDB URI
// const uri = `mongodb://localhost:27017/invoiceApp`;

// MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Declare collections globally
let db;
let collections = {};

// Function to create database and collections if they don't exist
const createDatabaseAndCollections = async (dbInstance) => {
  try {
    // List all collections to see what exists
    const existingCollections = await dbInstance.listCollections().toArray();
    const existingCollectionNames = existingCollections.map((col) => col.name);

    console.log("📋 Existing collections:", existingCollectionNames);

    // Define required collections
    const requiredCollections = [
      "associates",
      "products",
      "invoices",
      "invoiceItems",
      "deliveryNotes",
      "deliveryNoteItems",
      "payments",
      "purchases",
      "purchaseItems",
      "purchasePayments",
      "purchaseOrders",
      "purchaseOrderItems",
      "purchaseOrderPayments",
      "commissionAgents",
      "commissionHistory",
      "expenses",
      "creditNotes",
    ];

    // Create collections that don't exist
    for (const collectionName of requiredCollections) {
      if (!existingCollectionNames.includes(collectionName)) {
        await dbInstance.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      }
    }

    console.log("✅ Database and collections are ready!");
  } catch (error) {
    console.error("❌ Error creating collections:", error);
    throw error;
  }
};

// Connect and set collections
const connectDB = async () => {
  try {
    // Connect using native MongoDB driver (for existing code)
    await client.connect();
    db = client.db("invoiceApp");

    // Create database and collections if they don't exist
    await createDatabaseAndCollections(db);

    // Initialize all collections
    collections.associates = db.collection("associates");
    collections.products = db.collection("products");
    collections.invoices = db.collection("invoices");
    collections.invoiceItems = db.collection("invoiceItems");
    collections.deliveryNotes = db.collection("deliveryNotes");
    collections.deliveryNoteItems = db.collection("deliveryNoteItems");
    collections.payments = db.collection("payments");
    collections.purchases = db.collection("purchases");
    collections.purchaseItems = db.collection("purchaseItems");
    collections.purchasePayments = db.collection("purchasePayments");
    collections.purchaseOrders = db.collection("purchaseOrders");
    collections.purchaseOrderItems = db.collection("purchaseOrderItems");
    collections.purchaseOrderPayments = db.collection("purchaseOrderPayments");
    collections.commissionAgents = db.collection("commissionAgents");
    collections.commissionHistory = db.collection("commissionHistory");
    collections.expenses = db.collection("expenses");
    collections.creditNotes = db.collection("creditNotes");

    // Connect using Mongoose (for new authentication system)
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      "✅ Connected to MongoDB (native driver) and collections initialized."
    );
    console.log(
      "✅ Connected to MongoDB (Mongoose) for authentication system."
    );
  } catch (error) {
    console.error("❌ Database connection error:", error);
    process.exit(1);
  }
};

// Function to get collection by name
const getCollection = (collectionName) => {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  if (!collections[collectionName]) {
    throw new Error(`Collection '${collectionName}' not found.`);
  }
  return collections[collectionName];
};

// Helper functions for each collection
const getAssociatesCollection = () => getCollection("associates");
const getProductsCollection = () => getCollection("products");
const getInvoicesCollection = () => getCollection("invoices");
const getInvoiceItemsCollection = () => getCollection("invoiceItems");
const getDeliveryNotesCollection = () => getCollection("deliveryNotes");
const getDeliveryNoteItemsCollection = () => getCollection("deliveryNoteItems");
const getPaymentsCollection = () => getCollection("payments");
const getPurchasesCollection = () => getCollection("purchases");
const getPurchaseItemsCollection = () => getCollection("purchaseItems");
const getPurchasePaymentsCollection = () => getCollection("purchasePayments");
const getPurchaseOrdersCollection = () => getCollection("purchaseOrders");
const getPurchaseOrderItemsCollection = () =>
  getCollection("purchaseOrderItems");
const getPurchaseOrderPaymentsCollection = () =>
  getCollection("purchaseOrderPayments");
const getCommissionAgentsCollection = () => getCollection("commissionAgents");
const getCommissionHistoryCollection = () => getCollection("commissionHistory");
const getExpensesCollection = () => getCollection("expenses");
const getCreditNotesCollection = () => getCollection("creditNotes");

module.exports = {
  connectDB,
  db: () => db,
  getCollection,
  // Collection getters
  getAssociatesCollection,
  getProductsCollection,
  getInvoicesCollection,
  getInvoiceItemsCollection,
  getDeliveryNotesCollection,
  getDeliveryNoteItemsCollection,
  getPaymentsCollection,
  getPurchasesCollection,
  getPurchaseItemsCollection,
  getPurchasePaymentsCollection,
  getPurchaseOrdersCollection,
  getPurchaseOrderItemsCollection,
  getPurchaseOrderPaymentsCollection,
  getCommissionAgentsCollection,
  getCommissionHistoryCollection,
  getExpensesCollection,
  getCreditNotesCollection,
  // Legacy exports for backward compatibility
  associatesCollection: () => getCollection("associates"),
  productsCollection: () => getCollection("products"),
  invoicesCollection: () => getCollection("invoices"),
  invoiceItemsCollection: () => getCollection("invoiceItems"),
  deliveryNotesCollection: () => getCollection("deliveryNotes"),
  deliveryNoteItemsCollection: () => getCollection("deliveryNoteItems"),
  paymentsCollection: () => getCollection("payments"),
  purchasesCollection: () => getCollection("purchases"),
  purchaseItemsCollection: () => getCollection("purchaseItems"),
  purchasePaymentsCollection: () => getCollection("purchasePayments"),
  purchaseOrdersCollection: () => getCollection("purchaseOrders"),
  purchaseOrderItemsCollection: () => getCollection("purchaseOrderItems"),
  purchaseOrderPaymentsCollection: () => getCollection("purchaseOrderPayments"),
  commissionAgentsCollection: () => getCollection("commissionAgents"),
  commissionHistoryCollection: () => getCollection("commissionHistory"),
  expensesCollection: () => getCollection("expenses"),
  creditNotesCollection: () => getCollection("creditNotes"),
};
