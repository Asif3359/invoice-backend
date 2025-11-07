# Authentication Process Flow

## Overview
This document explains the step-by-step process for user registration and login for both **Main Users** and **Sub-Users**.

---

## 🔵 MAIN USER - Registration Process

### Endpoint: `POST /auth/register`

### Step-by-Step Process:

1. **Client sends registration request**
   ```
   POST /auth/register
   Body: {
     email: "user@example.com",
     password: "SecurePass123",
     fullName: "John Doe",
     phone: "+1234567890"  // optional
   }
   ```

2. **Server validates input**
   - Email format validation
   - Password strength check (min 8 chars, uppercase, lowercase, number)
   - Full name and phone validation (if provided)

3. **Check if user already exists**
   - Query database: `User.findOne({ email })`
   - If exists → Return error: "User with this email already exists"

4. **Hash password**
   - Use bcrypt to hash password with salt rounds of 10
   - Store hashed password (never store plain password)

5. **Generate verification token**
   - Create random 32-byte hex token for email verification

6. **Create user in database**
   ```javascript
   User {
     email: "user@example.com",
     passwordHash: "$2b$10$...",
     fullName: "John Doe",
     phone: "+1234567890",
     emailVerified: false,
     verificationToken: "abc123...",
     isActive: true
   }
   ```

7. **Generate JWT tokens**
   - **Access Token** (short-lived, 15 minutes): Contains `{ userId, email, userType: 'main' }`
   - **Refresh Token** (long-lived, 7 days): Same payload

8. **Create session record**
   ```javascript
   Session {
     userId: user._id,
     userType: 'main',
     refreshToken: "refresh_token_here",
     deviceInfo: { device: "iPhone", os: "iOS" },
     ipAddress: "192.168.1.1",
     expiresAt: Date + 7 days
   }
   ```

9. **Send verification email** (TODO - placeholder)
   - Email with verification link: `/auth/verify-email/:token`

10. **Return response**
    ```json
    {
      "success": true,
      "message": "User registered successfully. Please verify your email.",
      "data": {
        "user": {
          "id": "user_id",
          "email": "user@example.com",
          "fullName": "John Doe",
          "emailVerified": false
        },
        "tokens": {
          "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
      }
    }
    ```

---

## 🔵 MAIN USER - Login Process

### Endpoint: `POST /auth/login`

### Step-by-Step Process:

1. **Client sends login request**
   ```
   POST /auth/login
   Body: {
     email: "user@example.com",
     password: "SecurePass123",
     userType: "main"  // optional, defaults to 'main'
   }
   ```

2. **Server validates input**
   - Email format validation
   - Password not empty

3. **Find user in database**
   - Query: `User.findOne({ email: email.toLowerCase() })`
   - If not found → Return error: "Invalid email or password"

4. **Check if user is active**
   - If `user.isActive === false` → Return error: "Account is deactivated"

5. **Verify password**
   - Compare provided password with stored `passwordHash` using bcrypt
   - If password doesn't match → Return error: "Invalid email or password"

6. **Generate JWT tokens**
   - **Access Token**: `{ userId, email, userType: 'main' }` (expires in 15 minutes)
   - **Refresh Token**: Same payload (expires in 7 days)

7. **Create session record**
   - Save session with refresh token, device info, IP address
   - Session expires in 7 days

8. **Return response**
   ```json
   {
     "success": true,
     "message": "Login successful",
     "data": {
       "user": {
         "id": "user_id",
         "email": "user@example.com",
         "fullName": "John Doe",
         "emailVerified": true,
         "isActive": true
       },
       "tokens": {
         "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
         "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
       }
     }
   }
   ```

---

## 🟢 SUB-USER - Registration Process

### ⚠️ Important: Sub-users CANNOT register themselves!
### Only Main Users can create Sub-Users

### Endpoint: `POST /sub-users` (Requires Main User Authentication)

### Step-by-Step Process:

1. **Main user must be logged in first**
   - Main user must have valid JWT access token
   - Token must be in header: `Authorization: Bearer <accessToken>`

2. **Main user sends sub-user creation request**
   ```
   POST /sub-users
   Headers: {
     Authorization: "Bearer <main_user_access_token>"
   }
   Body: {
     email: "subuser@example.com",
     password: "SecurePass123",
     fullName: "Jane Smith",
     role: "manager",  // optional: 'admin', 'manager', 'viewer', 'accountant'
     permissions: {     // optional: flexible JSON permissions
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
       }
     }
   }
   ```

3. **Server authenticates main user**
   - Verify JWT token
   - Extract `userId` from token
   - Ensure user is main user (not sub-user)

4. **Server validates input**
   - Email format validation
   - Password strength check
   - Role validation (must be one of: admin, manager, viewer, accountant)
   - Permissions must be valid JSON object

5. **Check if sub-user email already exists**
   - Query: `SubUser.findOne({ email })`
   - If exists → Return error: "Sub-user with this email already exists"

6. **Hash password**
   - Use bcrypt to hash password

7. **Create sub-user in database**
   ```javascript
   SubUser {
     parentUserId: main_user._id,  // Links to main user
     email: "subuser@example.com",
     passwordHash: "$2b$10$...",
     fullName: "Jane Smith",
     role: "manager",
     permissions: {
       invoices: { create: true, read: true, update: true, delete: false },
       products: { create: false, read: true, update: false, delete: false }
     },
     isActive: true
   }
   ```

8. **Return response**
   ```json
   {
     "success": true,
     "message": "Sub-user created successfully",
     "data": {
       "subUser": {
         "id": "subuser_id",
         "email": "subuser@example.com",
         "fullName": "Jane Smith",
         "role": "manager",
         "permissions": { ... },
         "parentUser": {
           "id": "main_user_id",
           "email": "user@example.com",
           "fullName": "John Doe"
         }
       }
     }
   }
   ```

**Note**: Sub-user is created but NOT automatically logged in. They must login separately.

---

## 🟢 SUB-USER - Login Process

### Endpoint: `POST /auth/login` (Same as main user, but with `userType: 'sub'`)

### Step-by-Step Process:

1. **Sub-user sends login request**
   ```
   POST /auth/login
   Body: {
     email: "subuser@example.com",
     password: "SecurePass123",
     userType: "sub"  // ⚠️ Must specify 'sub' to login as sub-user
   }
   ```

2. **Server validates input**
   - Email format validation
   - Password not empty
   - userType must be 'sub'

3. **Find sub-user in database**
   - Query: `SubUser.findOne({ email: email.toLowerCase() })`
   - Also populate parent user info: `.populate('parentUserId')`
   - If not found → Return error: "Invalid email or password"

4. **Check if sub-user is active**
   - If `subUser.isActive === false` → Return error: "Account is deactivated"

5. **Verify password**
   - Compare provided password with stored `passwordHash`
   - If password doesn't match → Return error: "Invalid email or password"

6. **Generate JWT tokens**
   - **Access Token**: `{ userId: subUser._id, email, userType: 'sub' }` (expires in 15 minutes)
   - **Refresh Token**: Same payload (expires in 7 days)
   - ⚠️ **Important**: Token contains `userType: 'sub'` to distinguish from main users

7. **Create session record**
   ```javascript
   Session {
     userId: subUser._id,
     userType: 'sub',  // ⚠️ Important: marks as sub-user session
     refreshToken: "refresh_token_here",
     deviceInfo: { ... },
     ipAddress: "...",
     expiresAt: Date + 7 days
   }
   ```

8. **Return response**
   ```json
   {
     "success": true,
     "message": "Login successful",
     "data": {
       "user": {
         "id": "subuser_id",
         "email": "subuser@example.com",
         "fullName": "Jane Smith",
         "role": "manager",
         "permissions": { ... },
         "parentUser": {
           "id": "main_user_id",
           "email": "user@example.com",
           "fullName": "John Doe"
         }
       },
       "tokens": {
         "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
         "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
       }
     }
   }
   ```

---

## 🔄 Key Differences Summary

| Feature | Main User | Sub-User |
|---------|-----------|----------|
| **Registration** | Self-register via `/auth/register` | Created by Main User via `/sub-users` |
| **Login Endpoint** | `/auth/login` (userType: 'main') | `/auth/login` (userType: 'sub') |
| **JWT Token** | Contains `userType: 'main'` | Contains `userType: 'sub'` |
| **Permissions** | Full access (no restrictions) | Role-based + JSON permissions |
| **Can create sub-users?** | ✅ Yes | ❌ No |
| **Parent relationship** | None (top-level) | Linked to Main User |

---

## 🔐 Token Usage After Login

### Using Access Token:
```
GET /auth/profile
Headers: {
  Authorization: "Bearer <accessToken>"
}
```

### Refreshing Access Token:
```
POST /auth/refresh-token
Body: {
  refreshToken: "<refreshToken>"
}
```

### Logout:
```
POST /auth/logout
Body: {
  refreshToken: "<refreshToken>"
}
```

---

## 📊 Database Relationships

```
Main User (User)
  ├── id: "user_123"
  ├── email: "user@example.com"
  └── passwordHash: "$2b$10$..."

Sub-User 1 (SubUser)
  ├── id: "subuser_456"
  ├── parentUserId: "user_123"  ← References Main User
  ├── email: "subuser1@example.com"
  └── passwordHash: "$2b$10$..."

Sub-User 2 (SubUser)
  ├── id: "subuser_789"
  ├── parentUserId: "user_123"  ← References Main User
  ├── email: "subuser2@example.com"
  └── passwordHash: "$2b$10$..."

Session (for any user)
  ├── userId: "user_123" or "subuser_456"
  ├── userType: "main" or "sub"
  └── refreshToken: "..."
```

---

## 🎯 Complete Flow Example

### Scenario: Main User creates Sub-User, then Sub-User logs in

1. **Main User registers** → Gets tokens
2. **Main User logs in** → Gets new tokens
3. **Main User creates Sub-User** → Uses access token to authenticate
4. **Sub-User logs in** → Gets tokens (with userType: 'sub')
5. **Sub-User accesses resources** → Token checked for permissions

---

## ⚠️ Important Notes

1. **Sub-users cannot register themselves** - Only main users can create them
2. **Sub-users cannot create other sub-users** - Only main users can
3. **Login endpoint is the same** - But must specify `userType: 'sub'` for sub-users
4. **Tokens contain userType** - This determines what permissions are checked
5. **Sessions are tracked** - Both main and sub-users have session records
6. **Password reset works for both** - But must specify `userType` in request

