# Invoice App Backend

A RESTful API for invoice management built with Express.js and MongoDB.

## 🏗️ Project Structure

```
invoice-app-backend/
├── bin/
│   └── www                 # Server startup file
├── config/
│   └── database.js         # MongoDB connection and collections
├── controllers/
│   ├── associatesController.js
│   ├── productsController.js
│   ├── paymentsController.js
│   ├── invoicesController.js
│   └── purchasesController.js
├── middleware/             # Custom middleware (future use)
├── models/                 # Data models with validation
│   ├── Associate.js
│   ├── Product.js
│   ├── Payment.js
│   ├── Invoice.js
│   └── Purchase.js
├── routes/
│   ├── api/
│   │   ├── associates.js
│   │   ├── products.js
│   │   ├── payments.js
│   │   ├── invoices.js
│   │   └── purchases.js
│   └── index.js
├── public/                 # Static files
├── app.js                  # Express app configuration
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Environment variables set up

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your MongoDB credentials:
   ```
   DB_USER=your_mongodb_username
   DB_PASS=your_mongodb_password
   PORT=3000
   ```

4. Start the server:
   ```bash
   npm start
   ```

   Or for development with debug logs:
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### Associates
- `POST /associates` - Create associate
- `GET /associates/:userEmail` - Get all associates for user
- `PUT /associates/:id` - Update associate
- `DELETE /associates/:id` - Soft delete associate
- `POST /associates/sync` - Sync associates

### Products
- `POST /products` - Create product
- `GET /products/:userEmail` - Get all products for user
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Soft delete product
- `POST /products/sync` - Sync products

### Payments
- `POST /payments` - Create payment
- `GET /payments/:userEmail` - Get all payments for user
- `PUT /payments/:id` - Update payment
- `DELETE /payments/:id` - Soft delete payment
- `POST /payments/sync` - Sync payments

### Invoices
- `POST /invoices/sync` - Sync invoices and invoice items

### Purchases
- `POST /purchases/sync` - Sync purchases, purchase items, and purchase payments

## 🔧 Features

- **MVC Architecture**: Clean separation of concerns with controllers, routes, and configuration
- **Data Models**: Comprehensive models with validation, business logic, and schema definitions
- **MongoDB Integration**: Robust database operations with MongoDB Atlas
- **Sync Functionality**: Bidirectional sync for offline-first applications
- **Soft Deletes**: Data preservation with soft delete functionality
- **Error Handling**: Comprehensive error handling and logging
- **Environment Configuration**: Secure configuration management

## 📝 Notes

- All endpoints require `userEmail` for data isolation
- All entities use UUID `id` field for identification
- Sync operations use `synced: 0` flag for tracking sync status
- Soft deletes use `deleted: 1` flag instead of physical deletion
