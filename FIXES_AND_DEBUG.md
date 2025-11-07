# Fixes and Debugging Guide

## ✅ Fixed Issues

### 1. Duplicate Index Warnings

**Problem:** Mongoose was warning about duplicate indexes because:
- `unique: true` automatically creates an index
- We were also manually creating indexes with `schema.index()`

**Solution:** Removed duplicate index definitions:
- **User.js**: Removed `userSchema.index({ email: 1 })` (email already has `unique: true`)
- **SubUser.js**: Removed `subUserSchema.index({ email: 1 })` (email already has `unique: true`)
- **Session.js**: Removed `index: true` from field definitions and consolidated all indexes at the bottom

**Files Fixed:**
- `models/User.js`
- `models/SubUser.js`
- `models/Session.js`

---

## 🔍 Debugging the 400 Error

The 400 error is coming from **validation failure**. The registration endpoint has strict validation rules.

### Registration Validation Requirements

When you call `POST /auth/register`, the request body must meet these requirements:

#### ✅ Required Fields:
```json
{
  "email": "user@example.com",     // Must be valid email format
  "password": "SecurePass123"       // Must meet password requirements
}
```

#### ✅ Optional Fields:
```json
{
  "fullName": "John Doe",           // If provided, must be at least 2 characters
  "phone": "+1234567890"            // If provided, must match phone format
}
```

### Password Requirements:
1. **Minimum 8 characters**
2. **At least one uppercase letter** (A-Z)
3. **At least one lowercase letter** (a-z)
4. **At least one number** (0-9)

### Email Requirements:
- Must be valid email format (e.g., `user@example.com`)
- Will be automatically lowercased and trimmed

### Phone Requirements (if provided):
- Must match format: `+1234567890` or `(123) 456-7890` or similar

---

## 🐛 How to Debug

### 1. Check the Error Response

The 400 error response should include validation details:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "msg": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "path": "password",
      "location": "body"
    }
  ]
}
```

### 2. Check Server Logs

I've added console logging to see validation errors. Check your server console for:
```
Validation errors: [ ... ]
```

### 3. Test with Valid Data

Try this example request:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "fullName": "Test User"
  }'
```

### 4. Common Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Password must be at least 8 characters long" | Password too short | Use 8+ characters |
| "Password must contain at least one uppercase letter..." | Missing uppercase/lowercase/number | Include A-Z, a-z, 0-9 |
| "Please provide a valid email address" | Invalid email format | Use format: `user@example.com` |
| "Full name must be at least 2 characters long" | fullName too short (if provided) | Use 2+ characters or omit |
| "Please provide a valid phone number" | Invalid phone format (if provided) | Use valid format or omit |

---

## 📝 Example Valid Request

```json
POST /auth/register
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "id": "...",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "emailVerified": false
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

---

## 🔧 Testing from Frontend

If you're using Axios or fetch, make sure:

1. **Content-Type header is set:**
```javascript
headers: {
  'Content-Type': 'application/json'
}
```

2. **Password meets requirements:**
```javascript
{
  email: "user@example.com",
  password: "Test1234",  // ✅ Has uppercase, lowercase, number, 8+ chars
  fullName: "User Name"  // Optional
}
```

3. **Check the error response:**
```javascript
try {
  const response = await axios.post('/auth/register', data);
  console.log('Success:', response.data);
} catch (error) {
  console.error('Error:', error.response?.data); // This will show validation errors
  // error.response.data.errors will contain the validation details
}
```

---

## 🚀 Next Steps

1. **Restart your server** to apply the index fixes
2. **Check the error response** from your frontend to see which validation is failing
3. **Verify your password** meets all requirements
4. **Check server console** for validation error logs

The duplicate index warnings should now be gone, and you should see clear validation error messages in the response!

