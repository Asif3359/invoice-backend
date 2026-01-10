const express = require("express");
const router = express.Router();

// API Routes
const associatesRouter = require("./api/associates");
const productsRouter = require("./api/products");
const paymentsRouter = require("./api/payments");
const invoicesRouter = require("./api/invoices");
const purchasesRouter = require("./api/purchases");
const purchaseOrdersRouter = require("./api/purchaseOrders");
const commissionAgentsRouter = require("./api/commissionAgents");
const commissionHistoryRouter = require("./api/commissionHistory");
const expensesRouter = require("./api/expenses");
const creditNotesRouter = require("./api/creditNotes");
const deliveryNotesRouter = require("./api/deliveryNotes");
const warehousesRouter = require("./api/warehouses");
const inventoryRouter = require("./api/inventory");
const physicalStockTakeRouter = require("./api/physicalStockTake");
const stockTransfersRouter = require("./api/stockTransfers");

// Authentication Routes
const authRouter = require("./auth");
const subUsersRouter = require("./subusers");

// Basic routes
router.get("/", (req, res) => {
  res.send({
    message: "🌍 Invoice App Backend is running",
    status: "success",
  });
});

router.get("/test", (req, res) => {
  res.send("testing 🌍");
});

// Authentication routes
router.use("/auth", authRouter);
router.use("/sub-users", subUsersRouter);

// API routes
router.use("/associates", associatesRouter);
router.use("/products", productsRouter);
router.use("/payments", paymentsRouter);
router.use("/invoices", invoicesRouter);
router.use("/purchases", purchasesRouter);
router.use("/purchase-orders", purchaseOrdersRouter);
router.use("/commission-agents", commissionAgentsRouter);
router.use("/commission-history", commissionHistoryRouter);
router.use("/expenses", expensesRouter);
router.use("/credit-notes", creditNotesRouter);
router.use("/delivery-notes", deliveryNotesRouter);
router.use("/warehouses", warehousesRouter);
router.use("/inventory", inventoryRouter);
router.use("/physical-stock-take", physicalStockTakeRouter);
router.use("/stock-transfers", stockTransfersRouter);

module.exports = router;
