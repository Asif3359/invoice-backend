# Warehouse & Inventory Permissions Update

## ✅ Changes Applied to Backend Permission System

### 4 New Resources Added to `config/permissions.js`

#### 1. **Inventory** (`inventory`)
- **Purpose**: Controls access to inventory tracking and management
- **Actions**: create, read, update, delete, export
- **Used in**: `inventory.ts` service, inventory sync operations

#### 2. **Warehouses** (`warehouses`)
- **Purpose**: Controls access to warehouse CRUD operations
- **Actions**: create, read, update, delete, export
- **Used in**: `warehouse.ts` service, warehouse sync operations

#### 3. **Stock Transfers** (`stockTransfers`)
- **Purpose**: Controls access to stock transfer operations between warehouses
- **Actions**: create, read, update, delete, export
- **Used in**: `stockTransfers.ts` service, stock transfer sync operations

#### 4. **Physical Stock Take** (`physicalStockTake`)
- **Purpose**: Controls access to physical inventory counting and reconciliation
- **Actions**: create, read, update, delete, export
- **Used in**: `physicalStockTake.ts` service, stock take sync operations

---

## 📋 Permission Levels by Role

### 🔑 Admin (Business Admin)
**Full Access** - All permissions for all 4 new resources
```javascript
inventory: { create: ✅, read: ✅, update: ✅, delete: ✅, export: ✅ }
warehouses: { create: ✅, read: ✅, update: ✅, delete: ✅, export: ✅ }
stockTransfers: { create: ✅, read: ✅, update: ✅, delete: ✅, export: ✅ }
physicalStockTake: { create: ✅, read: ✅, update: ✅, delete: ✅, export: ✅ }
```

### 👔 Manager
**Full Access except Delete** - Can manage inventory and warehouses but not delete
```javascript
inventory: { create: ✅, read: ✅, update: ✅, delete: ❌, export: ✅ }
warehouses: { create: ✅, read: ✅, update: ✅, delete: ❌, export: ✅ }
stockTransfers: { create: ✅, read: ✅, update: ✅, delete: ❌, export: ✅ }
physicalStockTake: { create: ✅, read: ✅, update: ✅, delete: ❌, export: ✅ }
```

### 💰 Accountant
**Read-Only** - Can view inventory data for reporting
```javascript
inventory: { create: ❌, read: ✅, update: ❌, delete: ❌, export: ✅ }
warehouses: { create: ❌, read: ✅, update: ❌, delete: ❌, export: ✅ }
stockTransfers: { create: ❌, read: ✅, update: ❌, delete: ❌, export: ✅ }
physicalStockTake: { create: ❌, read: ✅, update: ❌, delete: ❌, export: ✅ }
```

### 👁️ Viewer
**Read-Only (No Export)** - Limited viewing access
```javascript
inventory: { create: ❌, read: ✅, update: ❌, delete: ❌, export: ❌ }
warehouses: { create: ❌, read: ✅, update: ❌, delete: ❌, export: ❌ }
stockTransfers: { create: ❌, read: ✅, update: ❌, delete: ❌, export: ❌ }
physicalStockTake: { create: ❌, read: ✅, update: ❌, delete: ❌, export: ❌ }
```

---

## 🎯 Complete Resource List (18 Total)

Now your permission system supports:

1. ✅ Invoices
2. ✅ Products
3. ✅ Purchases
4. ✅ Purchase Orders
5. ✅ Payments
6. ✅ Expenses
7. ✅ Delivery Notes
8. ✅ Credit Notes
9. ✅ Commission Agents
10. ✅ Commission History
11. ✅ **Inventory** ← NEW
12. ✅ **Warehouses** ← NEW
13. ✅ **Stock Transfers** ← NEW
14. ✅ **Physical Stock Take** ← NEW
15. ✅ Associates
16. ✅ Sub-Users Management
17. ✅ Reports
18. ✅ Settings

---

## 🔒 How Permissions Work

### In Your Backend Code
```javascript
const { RESOURCES, ACTIONS } = require('../config/permissions');

// Check if sub-user can create inventory records
if (req.user.hasPermission(RESOURCES.INVENTORY, ACTIONS.CREATE)) {
  // Allow inventory creation
}

// Check if sub-user can perform stock transfers
if (req.user.hasPermission(RESOURCES.STOCK_TRANSFERS, ACTIONS.UPDATE)) {
  // Allow stock transfer
}
```

### In Your Routes (with authorize middleware)
```javascript
const { hasPermission } = require('../middleware/authorize');
const { RESOURCES, ACTIONS } = require('../config/permissions');

// Protect inventory sync endpoint
router.post('/inventory/sync',
  authenticate,
  hasPermission(RESOURCES.INVENTORY, ACTIONS.CREATE),
  syncInventory
);

// Protect warehouse sync endpoint
router.post('/warehouses/sync',
  authenticate,
  hasPermission(RESOURCES.WAREHOUSES, ACTIONS.CREATE),
  syncWarehouses
);
```

---

## 📝 Usage Examples

### Example 1: Creating a Manager with Inventory Access
```javascript
const { getDefaultPermissionsForRole } = require('../config/permissions');

const newSubUser = new SubUser({
  parentUserId: mainUser._id,
  email: 'manager@example.com',
  passwordHash: hashedPassword,
  fullName: 'Inventory Manager',
  role: 'manager',
  permissions: getDefaultPermissionsForRole('manager'), // Automatically includes inventory permissions
  isActive: true
});

await newSubUser.save();
```

### Example 2: Custom Role with Specific Inventory Permissions
```javascript
const customPermissions = {
  inventory: { create: true, read: true, update: true, delete: false, export: true },
  warehouses: { create: false, read: true, update: false, delete: false, export: false },
  stockTransfers: { create: true, read: true, update: false, delete: false, export: false },
  physicalStockTake: { create: true, read: true, update: true, delete: false, export: true }
};

const newSubUser = new SubUser({
  parentUserId: mainUser._id,
  email: 'custom@example.com',
  passwordHash: hashedPassword,
  fullName: 'Custom Inventory User',
  role: 'custom',
  permissions: customPermissions,
  isActive: true
});
```

### Example 3: Checking Permission in Controller
```javascript
const syncInventory = async (req, res) => {
  // Check if user has permission
  if (req.userType === 'sub' && !req.user.hasPermission(RESOURCES.INVENTORY, ACTIONS.CREATE)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to sync inventory'
    });
  }

  // Proceed with inventory sync
  const { userEmail, inventory } = req.body;
  // ... sync logic
};
```

---

## 🎨 Frontend Integration

Your React Native app should now handle these permissions:

```typescript
// Example permission check in frontend
const canManageInventory = user.permissions?.inventory?.create && user.permissions?.inventory?.update;
const canViewWarehouses = user.permissions?.warehouses?.read;
const canTransferStock = user.permissions?.stockTransfers?.create;

// Conditional rendering
{canManageInventory && (
  <Button onPress={openInventoryForm}>Add Inventory</Button>
)}

{canViewWarehouses && (
  <WarehouseList />
)}

{canTransferStock && (
  <StockTransferButton />
)}
```

---

## ✅ Testing Recommendations

1. **Test Admin Role**: Verify full access to all warehouse/inventory features
2. **Test Manager Role**: Verify can create/update but not delete
3. **Test Accountant Role**: Verify read-only access with export capability
4. **Test Viewer Role**: Verify read-only access without export
5. **Test Custom Role**: Verify granular permission combinations work correctly

---

## 🚀 Next Steps

1. ✅ **Backend permissions updated** - Complete
2. ✅ **Models and controllers created** - Complete
3. ✅ **API routes registered** - Complete
4. ⚠️ **Update frontend SubUser management screens** to show new resources
5. ⚠️ **Update permission selection UI** to include inventory/warehouse options
6. ⚠️ **Test permission enforcement** in your Expo app

---

## 📚 Related Files

- `config/permissions.js` - Permission definitions (updated)
- `models/SubUser.js` - SubUser model with permission methods
- `middleware/authorize.js` - Permission checking middleware
- `controllers/inventoryController.js` - Inventory sync controller
- `controllers/warehousesController.js` - Warehouse sync controller
- `controllers/physicalStockTakeController.js` - Physical stock take controller
- `controllers/stockTransfersController.js` - Stock transfers controller
- `routes/api/inventory.js` - Inventory API routes
- `routes/api/warehouses.js` - Warehouse API routes
- `routes/api/physicalStockTake.js` - Physical stock take API routes
- `routes/api/stockTransfers.js` - Stock transfers API routes

---

**Last Updated**: January 11, 2026
**Status**: ✅ Complete and Ready for Use
