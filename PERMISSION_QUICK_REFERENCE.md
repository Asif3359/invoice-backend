# Permission System - Quick Reference

## Role Summary

| Role           | Access Level                         | Best For                          |
| -------------- | ------------------------------------ | --------------------------------- |
| **admin**      | ✅ Full access (like owner)          | Business partner, trusted manager |
| **manager**    | ✅ Create/Read/Update<br>❌ Delete   | Department heads, supervisors     |
| **accountant** | ✅ Financial operations<br>❌ Delete | Finance team, bookkeepers         |
| **viewer**     | ✅ Read-only                         | Auditors, consultants             |
| **custom**     | ✅ Fully customizable                | Special cases                     |

## Quick Commands

### 1. Create Business Admin (Full Access)

```json
POST /api/subusers
{
  "email": "admin@example.com",
  "password": "SecurePass123",
  "fullName": "Admin Name",
  "role": "admin"
}
```

### 2. Create Manager

```json
POST /api/subusers
{
  "email": "manager@example.com",
  "password": "SecurePass123",
  "fullName": "Manager Name",
  "role": "manager"
}
```

### 3. Create Custom Role

```json
POST /api/subusers
{
  "email": "custom@example.com",
  "password": "SecurePass123",
  "fullName": "Custom User",
  "role": "custom",
  "permissions": {
    "invoices": { "create": true, "read": true, "update": false, "delete": false, "export": true },
    "products": { "create": false, "read": true, "update": false, "delete": false, "export": false }
  }
}
```

### 4. Update Permissions

```json
PUT /api/subusers/:id
{
  "permissions": {
    "invoices": { "delete": true }
  }
}
```

### 5. Deactivate User

```json
PUT /api/subusers/:id
{
  "isActive": false
}
```

## Resources & Actions

### Available Resources

- `invoices`, `products`, `payments`, `purchases`, `expenses`
- `deliveryNotes`, `creditNotes`, `associates`
- `commissionAgents`, `commissionHistory`
- `subUsers`, `reports`, `settings`

### Available Actions

- `create`, `read`, `update`, `delete`, `export`, `import`

## Middleware Usage

```javascript
// Specific permission
hasPermission("invoices", "create");

// Role-based (admin automatically allowed)
hasRole("manager", "accountant");

// Main user only
isMainUser;

// Main user OR business admin
isMainUserOrBusinessAdmin;
```

## Key Differences

### Main User vs Business Admin

```
Main User (Owner)          Business Admin
├── ✅ All resources       ├── ✅ All resources
├── ✅ Manage sub-users    ├── ❌ Manage sub-users
├── ✅ Billing/settings    ├── ❌ Billing/settings
└── ✅ Delete account      └── ❌ Delete account
```

## Permission Object Structure

```javascript
{
  "resourceName": {
    "action": true/false,
    // Example:
    "create": true,
    "read": true,
    "update": true,
    "delete": false,
    "export": true
  }
}
```

## Common Patterns

### Pattern 1: Sales Team

```javascript
// Sales Manager
{ role: "custom", permissions: { invoices: {...}, associates: {...} } }

// Sales Rep
{ role: "custom", permissions: { invoices: { create: true, read: true } } }
```

### Pattern 2: Finance Team

```javascript
// Senior Accountant
{ role: "accountant" }

// Junior Accountant
{ role: "custom", permissions: { payments: {...}, expenses: {...} } }
```

### Pattern 3: Operations

```javascript
// Operations Director
{
  role: "admin";
}

// Operations Manager
{
  role: "manager";
}
```

## Testing Permissions

```javascript
// In code
if (subUser.hasPermission("invoices", "delete")) {
  // Allow delete
}

if (subUser.isBusinessAdmin()) {
  // Full access
}

const allPermissions = subUser.getEffectivePermissions();
```

## Security Checklist

- [ ] Use strong passwords (8+ chars, upper, lower, number)
- [ ] Start with minimal permissions (viewer/custom)
- [ ] Use business admin for trusted partners only
- [ ] Deactivate instead of delete (`isActive: false`)
- [ ] Review permissions regularly
- [ ] Never share main user credentials

## Troubleshooting

| Issue                   | Solution                          |
| ----------------------- | --------------------------------- |
| Permission denied       | Check `isActive: true` and role   |
| Admin can't access      | Verify `role === 'admin'` exactly |
| Custom role not working | Provide full permissions object   |
| Can't manage sub-users  | Only main user can do this        |

## API Endpoints

```
POST   /api/subusers              # Create sub-user
GET    /api/subusers              # List all sub-users
GET    /api/subusers/:id          # Get one sub-user
PUT    /api/subusers/:id          # Update sub-user
DELETE /api/subusers/:id          # Delete sub-user
PATCH  /api/subusers/:id/password # Change password
GET    /api/subusers/meta/permissions # Get permission structure
```

All endpoints require:

- Authentication: `Authorization: Bearer <token>`
- Main user access (business owner)

---

**For detailed documentation, see:** [PERMISSION_SYSTEM.md](./PERMISSION_SYSTEM.md)
