# Expo App Integration - Quick Start Guide

## 📦 Installation

### Required Packages

```bash
# Navigation (if not already installed)
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# AsyncStorage for token storage
npx expo install @react-native-async-storage/async-storage

# API calls
npm install axios

# Icons (if not already installed)
npx expo install @expo/vector-icons

# Optional: Redux (if you prefer Redux over Context API)
npm install @reduxjs/toolkit react-redux
```

---

## 🚀 5-Minute Setup

### Step 1: Create API Service (3 files)

**File: `src/services/api.js`**
```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://YOUR_API_URL/api'; // ← Change this

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

**File: `src/services/authService.js`**
```javascript
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.success) {
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.user));
    }
    return response;
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['authToken', 'userData']);
  },

  getCurrentUser: async () => {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  hasPermission: async (resource, action) => {
    const user = await authService.getCurrentUser();
    if (user?.userType === 'main') return true;
    if (user?.userType === 'sub' && user?.role === 'admin') return true;
    return user?.permissions?.[resource]?.[action] === true;
  },
};

export default authService;
```

**File: `src/services/subUserService.js`**
```javascript
import api from './api';

export const subUserService = {
  getAllSubUsers: () => api.get('/subusers'),
  getSubUser: (id) => api.get(`/subusers/${id}`),
  createSubUser: (data) => api.post('/subusers', data),
  updateSubUser: (id, data) => api.put(`/subusers/${id}`, data),
  deleteSubUser: (id) => api.delete(`/subusers/${id}`),
  getAvailablePermissions: () => api.get('/subusers/meta/permissions'),
};

export default subUserService;
```

---

### Step 2: Create Auth Context

**File: `src/context/AuthContext.js`**
```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (resource, action) => {
    if (user?.userType === 'main') return true;
    if (user?.userType === 'sub' && user?.role === 'admin') return true;
    return user?.permissions?.[resource]?.[action] === true;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    isMainUser: () => user?.userType === 'main',
    isBusinessAdmin: () => user?.userType === 'sub' && user?.role === 'admin',
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

---

### Step 3: Create Permission Hook

**File: `src/hooks/usePermissions.js`**
```javascript
import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { hasPermission } = useAuth();

  return {
    can: (resource, action) => hasPermission(resource, action),
    canCreate: (resource) => hasPermission(resource, 'create'),
    canRead: (resource) => hasPermission(resource, 'read'),
    canUpdate: (resource) => hasPermission(resource, 'update'),
    canDelete: (resource) => hasPermission(resource, 'delete'),
    canExport: (resource) => hasPermission(resource, 'export'),
  };
};

export default usePermissions;
```

---

### Step 4: Create Permission Components

**File: `src/components/PermissionGuard.js`**
```javascript
import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

export const PermissionGuard = ({ resource, action, children, fallback = null }) => {
  const { can } = usePermissions();
  return can(resource, action) ? <>{children}</> : fallback;
};

export default PermissionGuard;
```

**File: `src/components/PermissionButton.js`**
```javascript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { usePermissions } from '../hooks/usePermissions';

export const PermissionButton = ({ 
  resource, 
  action, 
  onPress, 
  title, 
  style,
  hideIfNoPermission = false 
}) => {
  const { can } = usePermissions();
  const hasPermission = can(resource, action);

  if (!hasPermission && hideIfNoPermission) return null;

  return (
    <TouchableOpacity
      style={[styles.button, style, !hasPermission && styles.disabled]}
      onPress={hasPermission ? onPress : null}
      disabled={!hasPermission}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  disabled: { backgroundColor: '#CCC', opacity: 0.6 },
  text: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default PermissionButton;
```

---

### Step 5: Update App.js

**File: `App.js`**
```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import MainNavigator from './src/navigation/MainNavigator';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
```

---

## 📱 Usage Examples

### Example 1: Hide Button Based on Permission

```javascript
import { PermissionGuard } from '../components/PermissionGuard';

function InvoiceScreen() {
  return (
    <View>
      {/* Only show delete button if user has permission */}
      <PermissionGuard resource="invoices" action="delete">
        <Button title="Delete" onPress={handleDelete} />
      </PermissionGuard>
    </View>
  );
}
```

### Example 2: Check Permission in Code

```javascript
import { usePermissions } from '../hooks/usePermissions';

function InvoiceScreen() {
  const { canDelete } = usePermissions();

  const handleDelete = () => {
    if (canDelete('invoices')) {
      // Proceed with delete
    } else {
      Alert.alert('Permission Denied', 'You cannot delete invoices');
    }
  };

  return <Button title="Delete" onPress={handleDelete} />;
}
```

### Example 3: Check User Type

```javascript
import { useAuth } from '../context/AuthContext';

function SettingsScreen() {
  const { isMainUser, user } = useAuth();

  return (
    <View>
      <Text>Logged in as: {user?.email}</Text>
      
      {/* Only show for main users */}
      {isMainUser() && (
        <Button 
          title="Manage Team" 
          onPress={() => navigation.navigate('SubUsers')} 
        />
      )}
    </View>
  );
}
```

### Example 4: Permission-Based Button

```javascript
import { PermissionButton } from '../components/PermissionButton';

function InvoiceScreen() {
  return (
    <View>
      {/* Button automatically disabled if no permission */}
      <PermissionButton
        resource="invoices"
        action="create"
        title="Create Invoice"
        onPress={handleCreate}
      />

      {/* Button hidden if no permission */}
      <PermissionButton
        resource="invoices"
        action="delete"
        title="Delete"
        onPress={handleDelete}
        hideIfNoPermission={true}
      />
    </View>
  );
}
```

---

## 🎯 Quick Migration: Add Permissions to Existing Screen

### Before (Your existing code):
```javascript
function InvoiceScreen() {
  return (
    <View>
      <Button title="Create" onPress={handleCreate} />
      <Button title="Delete" onPress={handleDelete} />
    </View>
  );
}
```

### After (With permissions):
```javascript
import { PermissionGuard } from '../components/PermissionGuard';

function InvoiceScreen() {
  return (
    <View>
      <PermissionGuard resource="invoices" action="create">
        <Button title="Create" onPress={handleCreate} />
      </PermissionGuard>

      <PermissionGuard resource="invoices" action="delete">
        <Button title="Delete" onPress={handleDelete} />
      </PermissionGuard>
    </View>
  );
}
```

**That's it! Your screen now respects permissions!**

---

## 🔐 Available Resources and Actions

### Resources
```javascript
'invoices'
'products'
'payments'
'purchases'
'expenses'
'deliveryNotes'
'creditNotes'
'associates'
'commissionAgents'
'commissionHistory'
'subUsers'
'reports'
'settings'
```

### Actions
```javascript
'create'
'read'
'update'
'delete'
'export'
'import'  // Only for products
```

---

## ✅ Testing Checklist

### Test with Main User
- [ ] Login works
- [ ] All features accessible
- [ ] Can access sub-user management
- [ ] No permission errors

### Test with Business Admin Sub-User
- [ ] Login works
- [ ] Can access all features (except sub-user management)
- [ ] Sees "Business Admin" badge/indicator
- [ ] No permission errors on regular features

### Test with Manager Sub-User
- [ ] Login works
- [ ] Can create/edit items
- [ ] Cannot delete items (buttons hidden/disabled)
- [ ] Cannot access sub-user management

### Test with Viewer Sub-User
- [ ] Login works
- [ ] Can only view items
- [ ] All edit/delete/create buttons hidden
- [ ] Can export data (if permission given)

### Test Permissions Update
- [ ] Change sub-user permissions from backend/postman
- [ ] Force logout and login again
- [ ] New permissions take effect immediately

---

## 🐛 Common Issues & Fixes

### Issue 1: Permission check always returns false
```javascript
// Check user data structure
const { user } = useAuth();
console.log('User:', user);
console.log('Permissions:', user?.permissions);

// Make sure permissions object exists and has correct structure
```

### Issue 2: User data not loading
```javascript
// Check AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const checkStorage = async () => {
  const token = await AsyncStorage.getItem('authToken');
  const userData = await AsyncStorage.getItem('userData');
  console.log('Token:', token);
  console.log('User Data:', userData);
};
```

### Issue 3: API calls failing
```javascript
// Update your API base URL
// In src/services/api.js
const API_BASE_URL = 'http://YOUR_ACTUAL_IP:3000/api';
// For local testing: 'http://192.168.1.XXX:3000/api'
// For production: 'https://your-domain.com/api'
```

### Issue 4: Permissions not updating after changes
```javascript
// Force refresh user data
const { refreshUser } = useAuth();

useEffect(() => {
  // Refresh user data when screen focuses
  const unsubscribe = navigation.addListener('focus', () => {
    refreshUser();
  });
  return unsubscribe;
}, [navigation]);
```

---

## 📚 File Structure

```
your-app/
├── App.js
├── src/
│   ├── context/
│   │   └── AuthContext.js
│   ├── hooks/
│   │   └── usePermissions.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   └── subUserService.js
│   ├── components/
│   │   ├── PermissionGuard.js
│   │   ├── PermissionButton.js
│   │   └── RoleBadge.js (optional)
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── InvoiceScreen.js
│   │   ├── SubUserManagementScreen.js (main user only)
│   │   └── ...
│   └── navigation/
│       └── MainNavigator.js
```

---

## 🎓 Next Steps

1. ✅ Install required packages
2. ✅ Create the 3 service files
3. ✅ Create AuthContext
4. ✅ Create usePermissions hook
5. ✅ Create PermissionGuard component
6. ✅ Update App.js with AuthProvider
7. ✅ Test login with main user
8. ✅ Create a sub-user from backend
9. ✅ Test login with sub-user
10. ✅ Add PermissionGuard to one screen
11. ✅ Test permissions work correctly
12. ✅ Gradually add to other screens

---

## 💡 Pro Tips

### Tip 1: Debug Mode
Add this to see what's happening:
```javascript
// In any screen
const { user, hasPermission } = useAuth();

console.log('Current User:', user);
console.log('Can delete invoices:', hasPermission('invoices', 'delete'));
```

### Tip 2: Global Permission Check
Create a debug screen:
```javascript
function DebugPermissionsScreen() {
  const { user, hasPermission } = useAuth();
  
  const resources = ['invoices', 'products', 'payments'];
  const actions = ['create', 'read', 'update', 'delete'];
  
  return (
    <ScrollView>
      <Text>User Type: {user?.userType}</Text>
      <Text>Role: {user?.role}</Text>
      
      {resources.map(resource => (
        <View key={resource}>
          <Text>{resource}:</Text>
          {actions.map(action => (
            <Text key={action}>
              {action}: {hasPermission(resource, action) ? '✅' : '❌'}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
```

### Tip 3: Environment Variables
Use `.env` for API URL:
```bash
# .env
API_BASE_URL=http://192.168.1.100:3000/api
```

```javascript
// src/services/api.js
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';
```

---

## 📖 Full Documentation

For complete details, see:
- **Full Integration Guide**: `EXPO_INTEGRATION_GUIDE.md`
- **Backend Docs**: `PERMISSION_SYSTEM.md`
- **Quick Reference**: `PERMISSION_QUICK_REFERENCE.md`

---

## 🆘 Need Help?

1. Check your API URL is correct
2. Verify backend is running
3. Test API endpoints with Postman first
4. Check console logs for errors
5. Review `EXPO_INTEGRATION_GUIDE.md` for detailed examples
6. Check `PERMISSION_SYSTEM.md` for backend details

**Happy coding! 🚀**


