# Sub-User Permission System Documentation

## Overview

This system manages sub-users with dynamic, role-based permissions. It allows the business owner (main user) to create sub-users with varying levels of access.

## User Hierarchy

```
Business Owner (User model)
  └── Sub-Users (SubUser model)
       ├── Business Admin (role: 'admin')
       ├── Manager (role: 'manager')
       ├── Accountant (role: 'accountant')
       ├── Viewer (role: 'viewer')
       └── Custom Role (role: 'custom')
```

### 1. **Business Owner** (Main User)

- Defined in `models/User.js`
- The actual owner of the business account
- Has unrestricted access to everything
- Can create and manage sub-users

### 2. **Business Admin** (Sub-User with role: 'admin')

- Defined in `models/SubUser.js` with `role: 'admin'`
- Has **full access** to everything, just like the business owner
- This is NOT a system admin, but a trusted person in the business
- Can perform all operations on all resources
- **Cannot** manage other sub-users (reserved for main user only)

### 3. **Other Roles**

- **Manager**: Can create/read/update most resources, but cannot delete
- **Accountant**: Focused on financial operations (invoices, payments, expenses)
- **Viewer**: Read-only access to most resources
- **Custom**: Fully customizable permissions

## Available Resources

The system manages permissions for these resources:

- `invoices` - Customer invoices
- `products` - Product catalog
- `payments` - Payment records
- `purchases` - Purchase orders
- `expenses` - Business expenses
- `deliveryNotes` - Delivery notes
- `creditNotes` - Credit notes
- `associates` - Business associates/customers
- `commissionAgents` - Commission agents
- `commissionHistory` - Commission history records
- `subUsers` - Sub-user management (restricted)
- `reports` - Business reports
- `settings` - System settings

## Available Actions

Each resource can have these actions:

- `create` - Create new records
- `read` - View/list records
- `update` - Modify existing records
- `delete` - Remove records
- `export` - Export data
- `import` - Import data (for products)

## Permission Structure

Permissions are stored as a nested object:

```javascript
{
  invoices: {
    create: true,
    read: true,
    update: true,
    delete: false,
    export: true
  },
  products: {
    create: false,
    read: true,
    update: false,
    delete: false,
    export: true,
    import: false
  },
  // ... other resources
}
```

## API Usage

### 1. Create a Business Admin (Full Access)

**Request:**

```http
POST /api/subusers
Content-Type: application/json
Authorization: Bearer <main_user_token>

{
  "email": "admin@company.com",
  "password": "SecurePass123",
  "fullName": "John Admin",
  "role": "admin"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Sub-user created successfully",
  "data": {
    "subUser": {
      "_id": "...",
      "email": "admin@company.com",
      "fullName": "John Admin",
      "role": "admin",
      "permissions": {
        "invoices": {
          "create": true,
          "read": true,
          "update": true,
          "delete": true,
          "export": true
        }
        // ... full permissions for all resources
      },
      "isActive": true
    }
  }
}
```

### 2. Create a Manager (Predefined Role)

**Request:**

```http
POST /api/subusers
Content-Type: application/json
Authorization: Bearer <main_user_token>

{
  "email": "manager@company.com",
  "password": "SecurePass123",
  "fullName": "Jane Manager",
  "role": "manager"
}
```

The system automatically assigns manager permissions (can create/read/update, but not delete).

### 3. Create a Custom Role User

**Request:**

```http
POST /api/subusers
Content-Type: application/json
Authorization: Bearer <main_user_token>

{
  "email": "sales@company.com",
  "password": "SecurePass123",
  "fullName": "Bob Sales",
  "role": "custom",
  "permissions": {
    "invoices": {
      "create": true,
      "read": true,
      "update": true,
      "delete": false,
      "export": true
    },
    "products": {
      "create": false,
      "read": true,
      "update": false,
      "delete": false,
      "export": false,
      "import": false
    },
    "associates": {
      "create": true,
      "read": true,
      "update": true,
      "delete": false,
      "export": false
    }
  }
}
```

### 4. Override Specific Permissions for a Predefined Role

You can override specific permissions even for predefined roles:

**Request:**

```http
POST /api/subusers
Content-Type: application/json
Authorization: Bearer <main_user_token>

{
  "email": "accountant@company.com",
  "password": "SecurePass123",
  "fullName": "Alice Accountant",
  "role": "accountant",
  "permissions": {
    "invoices": {
      "delete": true  // Override: allow this accountant to delete invoices
    }
  }
}
```

The system will merge this with the default accountant permissions.

### 5. Update Sub-User Permissions

**Request:**

```http
PUT /api/subusers/:id
Content-Type: application/json
Authorization: Bearer <main_user_token>

{
  "role": "manager",
  "permissions": {
    "expenses": {
      "delete": true  // Give this manager permission to delete expenses
    }
  }
}
```

### 6. Get Available Permissions (For Building UI)

**Request:**

```http
GET /api/subusers/meta/permissions
Authorization: Bearer <main_user_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "resources": {
      "INVOICES": "invoices",
      "PRODUCTS": "products"
      // ... all resources
    },
    "actions": {
      "CREATE": "create",
      "READ": "read"
      // ... all actions
    },
    "rolePermissions": {
      "admin": {
        /* full permissions */
      },
      "manager": {
        /* manager permissions */
      },
      "accountant": {
        /* accountant permissions */
      },
      "viewer": {
        /* viewer permissions */
      }
    }
  }
}
```

## Using Permissions in Routes

### Method 1: Check Specific Permission

```javascript
const { hasPermission } = require("../middleware/authorize");

// Only allow users with 'create' permission on 'invoices'
router.post(
  "/invoices",
  authenticate,
  hasPermission("invoices", "create"),
  invoiceController.createInvoice
);
```

### Method 2: Check Role

```javascript
const { hasRole } = require("../middleware/authorize");

// Only allow managers and accountants (admins automatically allowed)
router.get(
  "/reports",
  authenticate,
  hasRole("manager", "accountant"),
  reportController.getReports
);
```

### Method 3: Main User Only

```javascript
const { isMainUser } = require("../middleware/authorize");

// Only the business owner can access
router.post(
  "/subusers",
  authenticate,
  isMainUser,
  subUserController.createSubUser
);
```

### Method 4: Main User OR Business Admin

```javascript
const { isMainUserOrBusinessAdmin } = require("../middleware/authorize");

// Business owner or business admins can access
router.get(
  "/sensitive-reports",
  authenticate,
  isMainUserOrBusinessAdmin,
  reportController.getSensitiveReports
);
```

## Permission Checking in Models

The SubUser model provides helper methods:

```javascript
// Check if user has specific permission
if (subUser.hasPermission("invoices", "delete")) {
  // Allow deletion
}

// Check if user is business admin
if (subUser.isBusinessAdmin()) {
  // Full access
}

// Get all effective permissions (useful for frontend)
const permissions = subUser.getEffectivePermissions();
```

## Default Role Permissions

### Admin (Business Admin)

- ✅ **Everything** - Full access to all resources and actions
- ❌ Sub-user management (only main user)

### Manager

- ✅ Create, Read, Update, Export on most resources
- ❌ Delete on all resources
- ❌ Sub-user management

### Accountant

- ✅ Full access to invoices, payments, expenses, credit notes
- ✅ Read access to products, delivery notes, associates
- ❌ Delete on all resources
- ❌ Sub-user management

### Viewer

- ✅ Read and Export on most resources
- ❌ Create, Update, Delete on all resources
- ❌ Sub-user management

## Important Notes

### 1. Business Admin vs Main User

| Feature              | Main User (Owner) | Business Admin (Sub-User) |
| -------------------- | ----------------- | ------------------------- |
| Access to resources  | ✅ Full           | ✅ Full                   |
| Manage sub-users     | ✅ Yes            | ❌ No                     |
| Delete own account   | ✅ Yes            | ❌ No                     |
| Billing/subscription | ✅ Yes            | ❌ No                     |

**Use Case:**

- Make your most trusted employee/partner a Business Admin
- They can run the business operations fully
- But cannot add/remove team members or change billing

### 2. Custom Roles

Use `role: 'custom'` when predefined roles don't fit:

- Sales person who only needs invoices and associates
- Warehouse manager who only needs products and delivery notes
- Auditor who only needs read-only access to financial records

### 3. Permission Inheritance

When you set a predefined role (`admin`, `manager`, `accountant`, `viewer`):

- The system automatically loads default permissions
- You can override specific permissions
- The override is merged with defaults

### 4. Security Best Practices

1. **Principle of Least Privilege**: Start with minimal permissions and add as needed
2. **Regular Audits**: Review sub-user permissions regularly
3. **Deactivate Instead of Delete**: Use `isActive: false` to temporarily disable access
4. **Strong Passwords**: The system enforces strong password requirements
5. **Separate Admin**: Don't share main user credentials; create business admin sub-users instead

## Configuration

All permission definitions are in `config/permissions.js`. To add a new resource:

1. Add to `RESOURCES` constant
2. Define permissions in `FULL_PERMISSIONS`
3. Update each role in `ROLE_PERMISSIONS`
4. Add authorization middleware to relevant routes

## Examples

### Example 1: Sales Team Setup

```javascript
// Create sales manager (can manage invoices and associates)
{
  "email": "sales-manager@company.com",
  "role": "custom",
  "permissions": {
    "invoices": { "create": true, "read": true, "update": true, "delete": false, "export": true },
    "associates": { "create": true, "read": true, "update": true, "delete": false, "export": true },
    "products": { "create": false, "read": true, "update": false, "delete": false, "export": false }
  }
}

// Create sales rep (can only create invoices)
{
  "email": "sales-rep@company.com",
  "role": "custom",
  "permissions": {
    "invoices": { "create": true, "read": true, "update": false, "delete": false, "export": false },
    "associates": { "create": false, "read": true, "update": false, "delete": false, "export": false },
    "products": { "create": false, "read": true, "update": false, "delete": false, "export": false }
  }
}
```

### Example 2: Accounting Team Setup

```javascript
// Create senior accountant (full financial access)
{
  "email": "senior-accountant@company.com",
  "role": "accountant"
  // Gets full default accountant permissions
}

// Create junior accountant (limited access)
{
  "email": "junior-accountant@company.com",
  "role": "custom",
  "permissions": {
    "invoices": { "create": false, "read": true, "update": false, "delete": false, "export": true },
    "payments": { "create": true, "read": true, "update": false, "delete": false, "export": true },
    "expenses": { "create": true, "read": true, "update": false, "delete": false, "export": true }
  }
}
```

### Example 3: Management Team Setup

```javascript
// Create business admin (co-owner / partner)
{
  "email": "partner@company.com",
  "role": "admin"
  // Gets full access to everything
}

// Create operations manager
{
  "email": "ops-manager@company.com",
  "role": "manager"
  // Gets default manager permissions (create/read/update, no delete)
}
```

## Troubleshooting

### User can't access a resource

1. Check if user is active: `isActive: true`
2. Check user's role and permissions
3. For custom roles, ensure all required permissions are set
4. For business admins, ensure role is exactly `'admin'`

### Permission denied for business admin

1. Verify `role` field is `'admin'`
2. Check if `isActive` is `true`
3. For sub-user management, use main user instead (business admins can't manage sub-users)

### Permissions not updating

1. After role change, permissions are automatically recalculated
2. If using custom permissions, provide full permission object
3. Clear any cached tokens on the frontend

## Database Schema

```javascript
// SubUser Document
{
  "_id": ObjectId,
  "parentUserId": ObjectId,  // Reference to main User
  "email": String,
  "passwordHash": String,
  "fullName": String,
  "role": String,  // 'admin' | 'manager' | 'accountant' | 'viewer' | 'custom'
  "permissions": Object,  // Nested permission object
  "isActive": Boolean,
  "createdAt": Date,
  "updatedAt": Date
}
```

## Future Enhancements

- [ ] Permission templates (save custom permission sets)
- [ ] Audit logging (track who did what)
- [ ] Time-based permissions (access only during work hours)
- [ ] IP-based restrictions
- [ ] Two-factor authentication for sensitive roles
- [ ] Permission groups (assign multiple permissions at once)
- [ ] Delegated permissions (business admins can create limited sub-users)
