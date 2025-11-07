# Authentication System Documentation

## Overview
This authentication system provides user management with main users (master accounts) and sub-users (sub-accounts) with role-based permissions.

## Architecture

### Models
- **User.js** - Main user model (master accounts)
- **SubUser.js** - Sub-user model (belongs to a main user)
- **Session.js** - User session tracking with refresh tokens

### Middleware
- **authenticate.js** - JWT token verification middleware
- **authorize.js** - Role and permission-based authorization
- **rateLimiter.js** - Rate limiting for security

### Controllers
- **authController.js** - Authentication operations (register, login, logout, password reset, etc.)
- **subUserController.js** - Sub-user CRUD operations

### Routes
- **/auth** - Authentication endpoints
- **/sub-users** - Sub-user management endpoints

## API Endpoints

### Authentication Routes (`/auth`)

#### POST `/auth/register`
Register a new main user
- **Body**: `{ email, password, fullName?, phone? }`
- **Response**: User object and tokens

#### POST `/auth/login`
Login (main user or sub-user)
- **Body**: `{ email, password, userType?: 'main' | 'sub' }`
- **Response**: User object and tokens

#### POST `/auth/refresh-token`
Refresh access token
- **Body**: `{ refreshToken }`
- **Response**: New access token

#### POST `/auth/logout`
Logout (delete session)
- **Body**: `{ refreshToken }`

#### GET `/auth/profile`
Get current user profile
- **Headers**: `Authorization: Bearer <token>`
- **Response**: User object

#### POST `/auth/password-reset/request`
Request password reset
- **Body**: `{ email, userType?: 'main' | 'sub' }`

#### POST `/auth/password-reset`
Reset password with token
- **Body**: `{ token, password, userType?: 'main' | 'sub' }`

#### GET `/auth/verify-email/:token`
Verify email address

### Sub-User Routes (`/sub-users`)
All routes require authentication and main user access.

#### POST `/sub-users`
Create a new sub-user
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ email, password, fullName?, role?, permissions? }`
- **Roles**: `admin`, `manager`, `viewer`, `accountant`

#### GET `/sub-users`
Get all sub-users for current main user
- **Headers**: `Authorization: Bearer <token>`

#### GET `/sub-users/:id`
Get a single sub-user by ID
- **Headers**: `Authorization: Bearer <token>`

#### PUT `/sub-users/:id`
Update a sub-user
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ fullName?, role?, permissions?, isActive? }`

#### PATCH `/sub-users/:id/password`
Update sub-user password
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ password }`

#### DELETE `/sub-users/:id`
Delete a sub-user
- **Headers**: `Authorization: Bearer <token>`

## Permissions System

Sub-users have flexible permissions stored as JSON:
```json
{
  "invoices": {
    "create": true,
    "read": true,
    "update": true,
    "delete": false
  },
  "products": {
    "create": false,
    "read": true,
    "update": false,
    "delete": false
  },
  "payments": {
    "create": true,
    "read": true,
    "update": false,
    "delete": false
  }
}
```

## Usage Example

### Protecting Routes
```javascript
const authenticate = require('./middleware/authenticate');
const { hasPermission } = require('./middleware/authorize');

// Require authentication
router.get('/invoices', authenticate, getInvoices);

// Require authentication + permission
router.post('/invoices', authenticate, hasPermission('invoices', 'create'), createInvoice);

// Require authentication + role
router.delete('/invoices/:id', authenticate, hasRole('admin', 'manager'), deleteInvoice);
```

## Environment Variables

Add these to your `.env` file:
```
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

## Security Features

1. **Password Hashing**: Uses bcrypt with salt rounds of 10
2. **JWT Tokens**: Access tokens (short-lived) and refresh tokens (long-lived)
3. **Rate Limiting**: 
   - Auth endpoints: 5 requests per 15 minutes
   - Password reset: 3 requests per hour
   - General API: 100 requests per 15 minutes
4. **Input Validation**: Express-validator for request validation
5. **Session Management**: Tracks sessions with device info and IP address

## Database Schema (MongoDB/Mongoose)

### Users Collection
- `email` (unique, indexed)
- `passwordHash`
- `fullName`
- `phone`
- `emailVerified`
- `verificationToken`
- `resetToken`
- `resetTokenExpires`
- `isActive`
- `createdAt`, `updatedAt`

### SubUsers Collection
- `parentUserId` (references User)
- `email` (unique, indexed)
- `passwordHash`
- `fullName`
- `role` (enum: admin, manager, viewer, accountant)
- `permissions` (JSON object)
- `isActive`
- `createdAt`, `updatedAt`

### Sessions Collection
- `userId` (references User or SubUser)
- `userType` (enum: main, sub)
- `refreshToken` (indexed)
- `deviceInfo` (JSON)
- `ipAddress`
- `expiresAt` (TTL index for auto-deletion)
- `createdAt`, `updatedAt`

