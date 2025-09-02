require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

// // MongoDB URI
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gdf4x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB URI
const uri = `mongodb://localhost:27017/invoiceApp`;
// MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Declare collections globally
let db;
let collections = {};

// Function to create database and collections if they don't exist
const createDatabaseAndCollections = async (dbInstance) => {
  try {
    // List all collections to see what exists
    const existingCollections = await dbInstance.listCollections().toArray();
    const existingCollectionNames = existingCollections.map(col => col.name);
    
    console.log('📋 Existing collections:', existingCollectionNames);
    
    // Define required collections
    const requiredCollections = [
      'associates',
      'products', 
      'invoices',
      'invoiceItems',
      'payments',
      'purchases',
      'purchaseItems',
      'purchasePayments'
    ];
    
    // Create collections that don't exist
    for (const collectionName of requiredCollections) {
      if (!existingCollectionNames.includes(collectionName)) {
        await dbInstance.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      }
    }
    
    console.log('✅ Database and collections are ready!');
  } catch (error) {
    console.error('❌ Error creating collections:', error);
    throw error;
  }
};

// Connect and set collections
const connectDB = async () => {
  try {
    await client.connect();
    db = client.db("invoiceApp");
    
    // Create database and collections if they don't exist
    await createDatabaseAndCollections(db);
    
    // Initialize all collections
    collections.associates = db.collection("associates");
    collections.products = db.collection("products");
    collections.invoices = db.collection("invoices");
    collections.invoiceItems = db.collection("invoiceItems");
    collections.payments = db.collection("payments");
    collections.purchases = db.collection("purchases");
    collections.purchaseItems = db.collection("purchaseItems");
    collections.purchasePayments = db.collection("purchasePayments");

    console.log("✅ Connected to MongoDB and collections initialized.");
  } catch (error) {
    console.error("❌ Database connection error:", error);
    process.exit(1);
  }
};

// Function to get collection by name
const getCollection = (collectionName) => {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  if (!collections[collectionName]) {
    throw new Error(`Collection '${collectionName}' not found.`);
  }
  return collections[collectionName];
};

// Helper functions for each collection
const getAssociatesCollection = () => getCollection('associates');
const getProductsCollection = () => getCollection('products');
const getInvoicesCollection = () => getCollection('invoices');
const getInvoiceItemsCollection = () => getCollection('invoiceItems');
const getPaymentsCollection = () => getCollection('payments');
const getPurchasesCollection = () => getCollection('purchases');
const getPurchaseItemsCollection = () => getCollection('purchaseItems');
const getPurchasePaymentsCollection = () => getCollection('purchasePayments');

module.exports = {
  connectDB,
  db: () => db,
  getCollection,
  // Collection getters
  getAssociatesCollection,
  getProductsCollection,
  getInvoicesCollection,
  getInvoiceItemsCollection,
  getPaymentsCollection,
  getPurchasesCollection,
  getPurchaseItemsCollection,
  getPurchasePaymentsCollection,
  // Legacy exports for backward compatibility
  associatesCollection: () => getCollection('associates'),
  productsCollection: () => getCollection('products'),
  invoicesCollection: () => getCollection('invoices'),
  invoiceItemsCollection: () => getCollection('invoiceItems'),
  paymentsCollection: () => getCollection('payments'),
  purchasesCollection: () => getCollection('purchases'),
  purchaseItemsCollection: () => getCollection('purchaseItems'),
  purchasePaymentsCollection: () => getCollection('purchasePayments')
};
