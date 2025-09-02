const { getProductsCollection } = require('../config/database');

// ✅ Add Product (POST /products)
const createProduct = async (req, res) => {
  try {
    const { userEmail, data } = req.body;
    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");
    if (!data.id) return res.status(400).send("Missing id field in data");

    const product = {
      ...data,
      userEmail,
      synced: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: 0
    };

    const collection = getProductsCollection();
    const result = await collection.insertOne(product);
    console.log("Inserted product:", product);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).send("Error creating product");
  }
};

// ✅ Update Product by UUID (PUT /products/:id)
const updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail, data } = req.body;

    if (!userEmail || !data) return res.status(400).send("Missing userEmail or data");

    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: 0,
    };

    const collection = getProductsCollection();
    const result = await collection.updateOne(
      { id: id, userEmail },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) return res.status(404).send("Product not found or no permission");
    res.send({ success: true });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Error updating product");
  }
};

// ✅ Get All Products for a User (GET /products/:userEmail)
const getProducts = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const collection = getProductsCollection();
    const products = await collection.find({ userEmail, deleted: 0 }).toArray();
    res.send(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Error fetching products");
  }
};

// ✅ Soft Delete Product (DELETE /products/:id)
const deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const { userEmail } = req.body;

    if (!userEmail) return res.status(400).send("Missing userEmail");

    const collection = getProductsCollection();
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

    if (result.matchedCount === 0) return res.status(404).send("Product not found or no permission");
    res.send({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send("Error deleting product");
  }
};

// sync products
const syncProducts = async (req, res) => {
  try {
    const { userEmail, products } = req.body;
    if (!userEmail || !Array.isArray(products)) {
      return res.status(400).send("Missing userEmail or invalid products array");
    }

    const collection = getProductsCollection();
    const bulkOps = products.map((item) => {
      const filter = { id: item.id, userEmail };

      const {
        createdAt,
        id,
        productName,
        productCode,
        unit,
        description,
        saleRate,
        buyRate,
        openingStock,
        openingStockRate,
        minAlertLevel,
        openingStockValue,
        enableInventory,
        warehouse,
        updatedAt = new Date(),
        deleted,
      } = item;

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              id,
              productName,
              productCode,
              unit,
              description,
              saleRate,
              buyRate,
              openingStock,
              openingStockRate,
              minAlertLevel,
              openingStockValue,
              enableInventory,
              warehouse,
              updatedAt: new Date(updatedAt),
              synced: 0, // always 0 on server side
              deleted,
              userEmail
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
      .project({ userEmail: 0 }) // optional
      .toArray();

    res.send({ success: true, data: freshData });

  } catch (error) {
    console.error("❌ Product sync error:", error);
    res.status(500).send("Error syncing products");
  }
};

module.exports = {
  createProduct,
  updateProduct,
  getProducts,
  deleteProduct,
  syncProducts
};
