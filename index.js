require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
const { v4: uuidv4 } = require('uuid');
// const serverless = require('serverless-http');
// console.log("✅ Express serverless function initialized");

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gdf4x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
let associatesCollection;
let productsCollection;
let invoicesCollection;
let invoiceItemsCollection;
let paymentsCollection;

// Connect and set collections
client.connect().then(() => {
  db = client.db("invoiceApp");
  associatesCollection = db.collection("associates");
  productsCollection = db.collection("products");
  invoicesCollection = db.collection("invoices");
  invoiceItemsCollection = db.collection("invoiceItems");
  paymentsCollection = db.collection("payments");

  console.log("✅ Connected to MongoDB and collections initialized.");
});

app.get('/', (req, res) => {
  res.send('Hello world 🌍');
});

app.get('/test', (req, res) => {
  res.send('testing 🌍');
});

// associate codes:
// Create associate (POST /associates)
app.post('/associates', async (req, res) => {
  try {
    console.log("HEADERS:", req.headers);
    console.log("BODY:", req.body);
    const { userEmail, data } = req.body;
    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");
    // if (!data.id) return res.status(400).send("Missing id field in data");

    const associate = {
      ...data,
      id: uuidv4(),
      userEmail,
      synced: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: 0,
    };

    const result = await associatesCollection.insertOne(associate);
    console.log("Inserted", associate);
    console.log("result", result)
    res.status(201).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating associate");
  }
});

// Read all associates by user
app.get('/associates/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    const associates = await associatesCollection.find({ userEmail, deleted: false }).toArray();
    res.send(associates);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching associates");
  }
});

// Update associate by UUID 'id' field
app.put('/associates/:id', async (req, res) => {
  try {
    const id = req.params.id; // this is UUID, not Mongo _id
    const { userEmail, data } = req.body;
    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");

    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: false,
    };

    const result = await associatesCollection.updateOne(
      { id: id, userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) return res.status(404).send("Associate not found or no permission");
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating associate");
  }
});

// Soft delete associate by UUID 'id'
app.delete('/associates/:id', async (req, res) => {
  try {
    const id = req.params.id; // UUID here
    const { userEmail } = req.body;
    if (!userEmail) return res.status(400).send("Missing userEmail");

    const result = await associatesCollection.updateOne(
      { id: id, userEmail },
      { $set: { deleted: true, updatedAt: new Date(), synced: false } }
    );

    if (result.matchedCount === 0) return res.status(404).send("Associate not found or no permission");
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting associate");
  }
});

app.post('/associates/sync', async (req, res) => {
  try {
    const { userEmail, associates } = req.body;
    if (!userEmail || !Array.isArray(associates)) {
      return res.status(400).send("Missing userEmail or invalid associates array");
    }

    const bulkOps = associates.map((item) => {
      // Use the UUID 'id' field as identifier
      const filter = { id: item.id, userEmail };

      const updatedAt = item.updatedAt ? new Date(item.updatedAt) : new Date();

      return {
        updateOne: {
          filter,
          update: {
            $set: { ...item, userEmail, updatedAt, synced: true, deleted: item.deleted || false },
            $setOnInsert: { createdAt: new Date() },
          },
          upsert: true,
        }
      };
    });

    if (bulkOps.length > 0) {
      await associatesCollection.bulkWrite(bulkOps);
    }

    const freshData = await associatesCollection.find({ userEmail, deleted: false }).toArray();

    res.send({ success: true, data: freshData });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error syncing associates");
  }
});



app.listen(port, () => {
  console.log("🚀 Server is running on port: " + port);
});

// module.exports.handler = serverless(app);
