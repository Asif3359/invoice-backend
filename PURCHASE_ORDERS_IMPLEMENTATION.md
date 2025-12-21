# Purchase Orders Backend Implementation

## Overview

Complete backend implementation for Purchase Orders following the same pattern as Purchases, with enhanced features matching your frontend schema.

## Files Created

### 1. **`models/PurchaseOrder.js`**
Complete model with three classes:
- `PurchaseOrder` - Main purchase order model
- `PurchaseOrderItem` - Purchase order items/line items
- `PurchaseOrderPayment` - Payment records for purchase orders

**Features:**
- Full CRUD operations
- Validation for all fields
- Soft delete support (deleted flag)
- Sync support for mobile app
- Date handling for MongoDB

### 2. **`controllers/purchaseOrdersController.js`**
Controller with 6 main endpoints:
- `syncPurchaseOrders` - Bulk sync from mobile app
- `getPurchaseOrders` - Get all purchase orders for a user
- `getPurchaseOrderById` - Get single purchase order with items and payments
- `createPurchaseOrder` - Create new purchase order
- `updatePurchaseOrder` - Update existing purchase order
- `deletePurchaseOrder` - Soft delete purchase order

### 3. **`routes/api/purchaseOrders.js`**
RESTful routes:
- `POST /api/purchase-orders/sync` - Sync purchase orders
- `GET /api/purchase-orders` - Get all
- `GET /api/purchase-orders/:id` - Get single
- `POST /api/purchase-orders` - Create
- `PUT /api/purchase-orders/:id` - Update
- `DELETE /api/purchase-orders/:id` - Delete

### 4. **`config/database.js`** (Updated)
Added three new collections:
- `purchaseOrders`
- `purchaseOrderItems`
- `purchaseOrderPayments`

### 5. **`routes/index.js`** (Updated)
Added purchase orders router to main routes

---

## API Endpoints

### Base URL
```
http://localhost:3000/api/purchase-orders
```

### 1. Sync Purchase Orders (Mobile App)

**Endpoint:** `POST /api/purchase-orders/sync`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userEmail": "user@example.com",
  "purchaseOrders": [
    {
      "id": "uuid",
      "purchaseOrderNumber": "PO-0001",
      "purchaseOrderRef": "REF-001",
      "purchaseOrderDate": "2025-12-21",
      "dueDate": "2025-12-31",
      "purchaseOrderNote": "Sample note",
      "supplierId": "supplier-uuid",
      "subtotal": 1000,
      "discount": 50,
      "discountType": "percentage",
      "discountValue": 5,
      "tax": 95,
      "taxType": "percentage",
      "taxValue": 10,
      "taxEnabled": 1,
      "shipping": 20,
      "adjustment": 0,
      "adjustmentType": "",
      "adjustedTotal": 1065,
      "grandTotal": 1065,
      "notes": "{...JSON...}",
      "signature": "{...JSON...}",
      "formState": "{...JSON...}",
      "status": "draft",
      "createdAt": "2025-12-21T10:00:00Z",
      "updatedAt": "2025-12-21T10:00:00Z",
      "deleted": 0
    }
  ],
  "purchaseOrderItems": [
    {
      "id": "item-uuid",
      "purchaseOrderId": "uuid",
      "productId": "product-uuid",
      "productName": "Product Name",
      "quantity": 10,
      "rate": 100,
      "total": 1000,
      "category": "Category",
      "description": "Description",
      "productCode": "PRD-001",
      "unit": "pcs",
      "barcode": "123456789",
      "warehouseId": "warehouse-uuid",
      "warehouseName": "Main Warehouse",
      "warehouseLocation": "Location A",
      "updatedAt": "2025-12-21T10:00:00Z",
      "deleted": 0
    }
  ],
  "purchaseOrderPayments": [
    {
      "id": "payment-uuid",
      "purchaseOrderId": "uuid",
      "amount": 500,
      "method": "cash",
      "date": "2025-12-21",
      "note": "Partial payment",
      "createdAt": "2025-12-21T10:00:00Z",
      "updatedAt": "2025-12-21T10:00:00Z",
      "deleted": 0
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "purchaseOrders": [...],
  "purchaseOrderItems": [...],
  "purchaseOrderPayments": [...]
}
```

---

### 2. Get All Purchase Orders

**Endpoint:** `GET /api/purchase-orders?userEmail=user@example.com`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "purchaseOrders": [...],
  "purchaseOrderItems": [...],
  "purchaseOrderPayments": [...]
}
```

---

### 3. Get Single Purchase Order

**Endpoint:** `GET /api/purchase-orders/:id?userEmail=user@example.com`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "purchaseOrder": {...},
  "purchaseOrderItems": [...],
  "purchaseOrderPayments": [...]
}
```

---

### 4. Create Purchase Order

**Endpoint:** `POST /api/purchase-orders`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userEmail": "user@example.com",
  "purchaseOrder": {
    "id": "uuid",
    "purchaseOrderNumber": "PO-0001",
    "purchaseOrderDate": "2025-12-21",
    "supplierId": "supplier-uuid",
    "grandTotal": 1065,
    "status": "draft"
  },
  "purchaseOrderItems": [...],
  "purchaseOrderPayments": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Purchase order created successfully",
  "purchaseOrderId": "uuid"
}
```

---

### 5. Update Purchase Order

**Endpoint:** `PUT /api/purchase-orders/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userEmail": "user@example.com",
  "purchaseOrder": {
    "status": "complete",
    "grandTotal": 1100
  },
  "purchaseOrderItems": [...],
  "purchaseOrderPayments": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Purchase order updated successfully"
}
```

---

### 6. Delete Purchase Order

**Endpoint:** `DELETE /api/purchase-orders/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userEmail": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Purchase order deleted successfully"
}
```

---

## Schema Details

### Purchase Order Schema
```javascript
{
  id: String (required),
  userEmail: String (required),
  purchaseOrderNumber: String (required),
  purchaseOrderRef: String,
  purchaseOrderDate: Date (required),
  dueDate: Date,
  purchaseOrderNote: String,
  supplierId: String (required),
  subtotal: Number (default: 0),
  discount: Number (default: 0),
  discountType: String,
  discountValue: Number (default: 0),
  tax: Number (default: 0),
  taxType: String,
  taxValue: Number (default: 0),
  taxEnabled: Number (0 or 1),
  shipping: Number (default: 0),
  adjustment: Number (default: 0),
  adjustmentType: String,
  adjustedTotal: Number (default: 0),
  grandTotal: Number (default: 0),
  notes: String (JSON),
  signature: String (JSON),
  formState: String (JSON),
  status: String (enum: ['draft', 'request', 'pending', 'complete', 'cancelled']),
  synced: Number (0 or 1),
  deleted: Number (0 or 1),
  createdAt: Date,
  updatedAt: Date
}
```

### Purchase Order Item Schema
```javascript
{
  id: String (required),
  userEmail: String (required),
  purchaseOrderId: String (required),
  productId: String (required),
  productName: String (required),
  quantity: Number (required),
  rate: Number (required),
  total: Number (required),
  category: String,
  description: String,
  productCode: String,
  unit: String,
  barcode: String,
  warehouseId: String,
  warehouseName: String,
  warehouseLocation: String,
  synced: Number (0 or 1),
  deleted: Number (0 or 1),
  updatedAt: Date
}
```

### Purchase Order Payment Schema
```javascript
{
  id: String (required),
  userEmail: String (required),
  purchaseOrderId: String (required),
  amount: Number (required),
  method: String,
  date: Date (required),
  note: String,
  createdAt: Date,
  synced: Number (0 or 1),
  deleted: Number (0 or 1),
  updatedAt: Date
}
```

---

## Status Values

Purchase orders can have the following statuses:
- `draft` - Initial draft state
- `request` - Purchase order requested
- `pending` - Awaiting fulfillment
- `complete` - Completed/received
- `cancelled` - Cancelled purchase order

---

## Integration with Frontend

### Update Frontend Sync Function

In your frontend `syncPurchaseOrdersWithServer` function, change the endpoint:

```typescript
// Before (using purchases endpoint)
const response = await axios.post(
  getApiEndpoints().purchases,
  {
    userEmail,
    purchaseOrders: unsyncedPurchaseOrders,
    // ...
  }
);

// After (using dedicated purchase-orders endpoint)
const response = await axios.post(
  `${API_BASE_URL}/purchase-orders/sync`,
  {
    userEmail,
    purchaseOrders: unsyncedPurchaseOrders,
    purchaseOrderItems: unsyncedItems,
    purchaseOrderPayments: unsyncedPayments,
  }
);
```

### Add to API Config

```typescript
// In your API config file
export const getApiEndpoints = () => ({
  // ... existing endpoints
  purchaseOrders: `${API_BASE_URL}/purchase-orders`,
  purchaseOrdersSync: `${API_BASE_URL}/purchase-orders/sync`,
});
```

---

## Testing

### Test with cURL

```bash
# 1. Sync Purchase Orders
curl -X POST http://localhost:3000/api/purchase-orders/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "purchaseOrders": [...],
    "purchaseOrderItems": [...],
    "purchaseOrderPayments": [...]
  }'

# 2. Get All Purchase Orders
curl -X GET "http://localhost:3000/api/purchase-orders?userEmail=test@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Get Single Purchase Order
curl -X GET "http://localhost:3000/api/purchase-orders/PO-ID?userEmail=test@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Create Purchase Order
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "purchaseOrder": {...},
    "purchaseOrderItems": [...],
    "purchaseOrderPayments": [...]
  }'

# 5. Update Purchase Order
curl -X PUT http://localhost:3000/api/purchase-orders/PO-ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "purchaseOrder": {"status": "complete"}
  }'

# 6. Delete Purchase Order
curl -X DELETE http://localhost:3000/api/purchase-orders/PO-ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userEmail": "test@example.com"}'
```

---

## Key Differences from Purchases

### Enhanced Fields
1. **More detailed metadata:**
   - `purchaseOrderRef` - Reference number
   - `purchaseOrderNote` - Notes specific to the order
   - Separate discount/tax type and value fields

2. **Warehouse support:**
   - Items include warehouse information
   - `warehouseId`, `warehouseName`, `warehouseLocation`

3. **Product details in items:**
   - Full product information stored with each item
   - `productName`, `productCode`, `unit`, `barcode`

4. **Different status values:**
   - Purchase: `draft`, `ordered`, `received`, `paid`, `cancelled`
   - Purchase Order: `draft`, `request`, `pending`, `complete`, `cancelled`

5. **Payment date field:**
   - Purchases use `paidAt`
   - Purchase Orders use `date`

---

## Migration Notes

### If You Have Existing Purchase Data

The Purchase and Purchase Order systems are separate. You can:

1. **Keep both systems** - They don't conflict
2. **Migrate data** - Create a migration script if needed
3. **Use Purchase Orders going forward** - More feature-rich

### Migration Script Example

```javascript
// Migrate purchases to purchase orders
const migratePurchasesToPurchaseOrders = async () => {
  const purchases = await getPurchasesCollection().find({}).toArray();
  
  for (const purchase of purchases) {
    const purchaseOrder = {
      ...purchase,
      purchaseOrderNumber: purchase.purchaseNumber,
      purchaseOrderDate: purchase.purchaseDate,
      purchaseOrderNote: purchase.notes,
      // Map other fields...
    };
    
    await getPurchaseOrdersCollection().insertOne(purchaseOrder);
  }
};
```

---

## Database Collections

After starting the server, these collections will be automatically created:

- `purchaseOrders` - Main purchase order records
- `purchaseOrderItems` - Line items for each order
- `purchaseOrderPayments` - Payment records for orders

---

## Summary

✅ **Complete implementation** matching your frontend schema  
✅ **Full CRUD operations** with validation  
✅ **Mobile app sync** support  
✅ **Soft delete** functionality  
✅ **Enhanced features** beyond basic Purchases  
✅ **RESTful API** design  
✅ **Authenticated routes** with token support  
✅ **No linter errors**  

The implementation is **production-ready** and follows the same patterns as your existing code! 🚀

