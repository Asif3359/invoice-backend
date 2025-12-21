# Expo/React Native Integration Guide - Sub-User Permission System

## Overview

This guide explains how to integrate the sub-user permission system into your existing Expo (React Native) app **without breaking existing functionality**. The integration is designed to be backward compatible.

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [API Service Setup](#api-service-setup)
3. [State Management](#state-management)
4. [Permission Checking](#permission-checking)
5. [UI Components](#ui-components)
6. [Screen Integration](#screen-integration)
7. [Backward Compatibility](#backward-compatibility)
8. [Complete Examples](#complete-examples)

---

## Authentication Flow

### Current Flow (Unchanged for Main Users)

```
Main User Login → Get Token → Access All Features
```

### New Flow (Supports Both)

```
Login → Check User Type →
  ├── Main User → Full Access
  └── Sub-User → Check Permissions → Limited Access
```

### Updated Auth Response

The login response now includes user type information:

```javascript
// Main User Login Response
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "email": "owner@company.com",
    "fullName": "Business Owner",
    "userType": "main"  // ← Main user
  }
}

// Sub-User Login Response
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "subuser_id",
    "email": "manager@company.com",
    "fullName": "Manager Name",
    "role": "manager",  // ← Role
    "permissions": {    // ← Permissions object
      "invoices": { "create": true, "read": true, "update": true, "delete": false },
      "products": { "create": false, "read": true, "update": false, "delete": false }
    },
    "isActive": true,
    "userType": "sub"   // ← Sub-user
  }
}
```

---

## API Service Setup

### 1. Update API Configuration

```javascript
// src/services/api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://your-api-url.com/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      AsyncStorage.multiRemove(["authToken", "userData"]);
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Create Sub-User Service

```javascript
// src/services/subUserService.js
import api from "./api";

export const subUserService = {
  // Get all sub-users (Main user only)
  getAllSubUsers: async () => {
    return await api.get("/subusers");
  },

  // Get single sub-user
  getSubUser: async (id) => {
    return await api.get(`/subusers/${id}`);
  },

  // Create sub-user
  createSubUser: async (data) => {
    return await api.post("/subusers", data);
  },

  // Update sub-user
  updateSubUser: async (id, data) => {
    return await api.put(`/subusers/${id}`, data);
  },

  // Update sub-user password
  updateSubUserPassword: async (id, password) => {
    return await api.patch(`/subusers/${id}/password`, { password });
  },

  // Delete sub-user
  deleteSubUser: async (id) => {
    return await api.delete(`/subusers/${id}`);
  },

  // Get available permissions (for UI building)
  getAvailablePermissions: async () => {
    return await api.get("/subusers/meta/permissions");
  },
};

export default subUserService;
```

### 3. Update Auth Service

```javascript
// src/services/authService.js
import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const authService = {
  // Login (works for both main users and sub-users)
  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      if (response.success) {
        // Store token and user data
        await AsyncStorage.setItem("authToken", response.token);
        await AsyncStorage.setItem("userData", JSON.stringify(response.user));

        return response;
      }

      throw new Error(response.message || "Login failed");
    } catch (error) {
      throw error;
    }
  },

  // Logout
  logout: async () => {
    await AsyncStorage.multiRemove(["authToken", "userData"]);
  },

  // Get current user from storage
  getCurrentUser: async () => {
    const userData = await AsyncStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  },

  // Check if user is main user
  isMainUser: async () => {
    const user = await authService.getCurrentUser();
    return user?.userType === "main";
  },

  // Check if user is business admin
  isBusinessAdmin: async () => {
    const user = await authService.getCurrentUser();
    return user?.userType === "sub" && user?.role === "admin";
  },

  // Check if user has permission
  hasPermission: async (resource, action) => {
    const user = await authService.getCurrentUser();

    // Main users have all permissions
    if (user?.userType === "main") return true;

    // Business admins have all permissions
    if (user?.userType === "sub" && user?.role === "admin") return true;

    // Check specific permission for sub-users
    if (user?.userType === "sub") {
      return user?.permissions?.[resource]?.[action] === true;
    }

    return false;
  },
};

export default authService;
```

---

## State Management

### Option 1: Context API (Recommended for Small-Medium Apps)

```javascript
// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import authService from "../services/authService";

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
      console.error("Failed to load user:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Check if current user is main user
  const isMainUser = () => {
    return user?.userType === "main";
  };

  // Check if current user is business admin
  const isBusinessAdmin = () => {
    return user?.userType === "sub" && user?.role === "admin";
  };

  // Check permission
  const hasPermission = (resource, action) => {
    // Main users have all permissions
    if (user?.userType === "main") return true;

    // Business admins have all permissions
    if (user?.userType === "sub" && user?.role === "admin") return true;

    // Check specific permission
    if (user?.userType === "sub") {
      return user?.permissions?.[resource]?.[action] === true;
    }

    return false;
  };

  // Get user role display name
  const getRoleDisplay = () => {
    if (user?.userType === "main") return "Business Owner";
    if (user?.userType === "sub") {
      const roleNames = {
        admin: "Business Admin",
        manager: "Manager",
        accountant: "Accountant",
        viewer: "Viewer",
        custom: "Custom Role",
      };
      return roleNames[user?.role] || "Sub-User";
    }
    return "Unknown";
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    isMainUser,
    isBusinessAdmin,
    hasPermission,
    getRoleDisplay,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
```

### Option 2: Redux (For Larger Apps)

```javascript
// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../../services/authService";

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authService.login(email, password);
      return response.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser();
      return user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      authService.logout();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      });
  },
});

export const { logout } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsMainUser = (state) => state.auth.user?.userType === "main";
export const selectIsBusinessAdmin = (state) =>
  state.auth.user?.userType === "sub" && state.auth.user?.role === "admin";
export const selectHasPermission = (resource, action) => (state) => {
  const user = state.auth.user;
  if (user?.userType === "main") return true;
  if (user?.userType === "sub" && user?.role === "admin") return true;
  if (user?.userType === "sub") {
    return user?.permissions?.[resource]?.[action] === true;
  }
  return false;
};

export default authSlice.reducer;
```

---

## Permission Checking

### Custom Hook for Permissions

```javascript
// src/hooks/usePermissions.js
import { useAuth } from "../context/AuthContext";

export const usePermissions = () => {
  const { user, hasPermission, isMainUser, isBusinessAdmin } = useAuth();

  return {
    // Check single permission
    can: (resource, action) => hasPermission(resource, action),

    // Check multiple permissions (any)
    canAny: (checks) => {
      return checks.some(([resource, action]) =>
        hasPermission(resource, action)
      );
    },

    // Check multiple permissions (all)
    canAll: (checks) => {
      return checks.every(([resource, action]) =>
        hasPermission(resource, action)
      );
    },

    // Shortcuts
    canCreate: (resource) => hasPermission(resource, "create"),
    canRead: (resource) => hasPermission(resource, "read"),
    canUpdate: (resource) => hasPermission(resource, "update"),
    canDelete: (resource) => hasPermission(resource, "delete"),
    canExport: (resource) => hasPermission(resource, "export"),

    // User type checks
    isOwner: isMainUser(),
    isAdmin: isBusinessAdmin(),
    isSubUser: user?.userType === "sub",

    // Get current role
    role: user?.role || null,
    userType: user?.userType || null,
  };
};

export default usePermissions;
```

---

## UI Components

### 1. Permission Guard Component

```javascript
// src/components/PermissionGuard.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { usePermissions } from "../hooks/usePermissions";

export const PermissionGuard = ({
  resource,
  action,
  children,
  fallback = null,
  showMessage = false,
}) => {
  const { can } = usePermissions();

  if (!can(resource, action)) {
    if (showMessage) {
      return (
        <View style={styles.deniedContainer}>
          <Text style={styles.deniedText}>
            You don't have permission to {action} {resource}
          </Text>
        </View>
      );
    }
    return fallback;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  deniedContainer: {
    padding: 16,
    backgroundColor: "#FEE",
    borderRadius: 8,
    margin: 16,
  },
  deniedText: {
    color: "#C00",
    textAlign: "center",
  },
});

export default PermissionGuard;
```

### 2. Conditional Button Component

```javascript
// src/components/PermissionButton.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { usePermissions } from "../hooks/usePermissions";

export const PermissionButton = ({
  resource,
  action,
  onPress,
  title,
  style,
  textStyle,
  disabledStyle,
  hideIfNoPermission = false,
  ...props
}) => {
  const { can } = usePermissions();
  const hasPermission = can(resource, action);

  if (!hasPermission && hideIfNoPermission) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        style,
        !hasPermission && [styles.disabledButton, disabledStyle],
      ]}
      onPress={hasPermission ? onPress : null}
      disabled={!hasPermission}
      {...props}
    >
      <Text style={[styles.buttonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#CCC",
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PermissionButton;
```

### 3. Role Badge Component

```javascript
// src/components/RoleBadge.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";

export const RoleBadge = ({ style }) => {
  const { getRoleDisplay, user } = useAuth();

  const getRoleColor = () => {
    if (user?.userType === "main") return "#4CAF50";
    if (user?.role === "admin") return "#FF9800";
    if (user?.role === "manager") return "#2196F3";
    if (user?.role === "accountant") return "#9C27B0";
    if (user?.role === "viewer") return "#607D8B";
    return "#757575";
  };

  return (
    <View style={[styles.badge, { backgroundColor: getRoleColor() }, style]}>
      <Text style={styles.badgeText}>{getRoleDisplay()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default RoleBadge;
```

### 4. User Type Indicator

```javascript
// src/components/UserTypeIndicator.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

export const UserTypeIndicator = () => {
  const { user, isMainUser, isBusinessAdmin } = useAuth();

  const getIcon = () => {
    if (isMainUser()) return "account-circle";
    if (isBusinessAdmin()) return "admin-panel-settings";
    return "person";
  };

  const getLabel = () => {
    if (isMainUser()) return "Owner";
    if (isBusinessAdmin()) return "Admin";
    return user?.role?.toUpperCase() || "USER";
  };

  return (
    <View style={styles.container}>
      <MaterialIcons name={getIcon()} size={20} color="#666" />
      <Text style={styles.label}>{getLabel()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
});

export default UserTypeIndicator;
```

---

## Screen Integration

### Example: Invoice List Screen

```javascript
// src/screens/InvoiceListScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { usePermissions } from "../hooks/usePermissions";
import PermissionButton from "../components/PermissionButton";
import PermissionGuard from "../components/PermissionGuard";

export const InvoiceListScreen = ({ navigation }) => {
  const [invoices, setInvoices] = useState([]);
  const { can, canCreate, canUpdate, canDelete } = usePermissions();

  useEffect(() => {
    // Check if user can read invoices
    if (can("invoices", "read")) {
      loadInvoices();
    } else {
      Alert.alert(
        "Access Denied",
        "You don't have permission to view invoices"
      );
      navigation.goBack();
    }
  }, []);

  const loadInvoices = async () => {
    // Your existing load logic
  };

  const handleCreate = () => {
    navigation.navigate("CreateInvoice");
  };

  const handleEdit = (invoice) => {
    if (canUpdate("invoices")) {
      navigation.navigate("EditInvoice", { invoice });
    } else {
      Alert.alert(
        "Access Denied",
        "You don't have permission to edit invoices"
      );
    }
  };

  const handleDelete = (invoiceId) => {
    if (canDelete("invoices")) {
      Alert.alert("Delete Invoice", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteInvoice(invoiceId),
        },
      ]);
    } else {
      Alert.alert(
        "Access Denied",
        "You don't have permission to delete invoices"
      );
    }
  };

  const renderInvoice = ({ item }) => (
    <View style={styles.invoiceCard}>
      <View style={styles.invoiceInfo}>
        <Text style={styles.invoiceNumber}>#{item.invoiceNumber}</Text>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.amount}>${item.total}</Text>
      </View>

      <View style={styles.actions}>
        {/* Edit button - only show if user has permission */}
        <PermissionGuard resource="invoices" action="update">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
          >
            <MaterialIcons name="edit" size={20} color="#2196F3" />
          </TouchableOpacity>
        </PermissionGuard>

        {/* Delete button - only show if user has permission */}
        <PermissionGuard resource="invoices" action="delete">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item.id)}
          >
            <MaterialIcons name="delete" size={20} color="#F44336" />
          </TouchableOpacity>
        </PermissionGuard>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Create button - check permission */}
      <PermissionGuard resource="invoices" action="create">
        <PermissionButton
          resource="invoices"
          action="create"
          title="Create Invoice"
          onPress={handleCreate}
          style={styles.createButton}
        />
      </PermissionGuard>

      <FlatList
        data={invoices}
        renderItem={renderInvoice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      {/* Export button */}
      <PermissionGuard resource="invoices" action="export">
        <TouchableOpacity style={styles.exportButton}>
          <MaterialIcons name="file-download" size={24} color="#FFF" />
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </PermissionGuard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  createButton: {
    margin: 16,
  },
  list: {
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  customerName: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4CAF50",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  exportButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#FF9800",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  exportText: {
    color: "#FFF",
    fontWeight: "600",
  },
});

export default InvoiceListScreen;
```

### Example: Sub-User Management Screen (Main User Only)

```javascript
// src/screens/SubUserManagementScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import subUserService from "../services/subUserService";

export const SubUserManagementScreen = ({ navigation }) => {
  const [subUsers, setSubUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isMainUser } = useAuth();

  useEffect(() => {
    // Only main users can access this screen
    if (!isMainUser()) {
      Alert.alert(
        "Access Denied",
        "Only the business owner can manage sub-users",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }

    loadSubUsers();
  }, []);

  const loadSubUsers = async () => {
    try {
      setLoading(true);
      const response = await subUserService.getAllSubUsers();
      if (response.success) {
        setSubUsers(response.data.subUsers);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load sub-users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigation.navigate("CreateSubUser", { onSuccess: loadSubUsers });
  };

  const handleEdit = (subUser) => {
    navigation.navigate("EditSubUser", { subUser, onSuccess: loadSubUsers });
  };

  const handleDelete = (subUserId) => {
    Alert.alert(
      "Delete Sub-User",
      "Are you sure you want to delete this sub-user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await subUserService.deleteSubUser(subUserId);
              Alert.alert("Success", "Sub-user deleted successfully");
              loadSubUsers();
            } catch (error) {
              Alert.alert("Error", "Failed to delete sub-user");
            }
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: "#FF9800",
      manager: "#2196F3",
      accountant: "#9C27B0",
      viewer: "#607D8B",
      custom: "#757575",
    };
    return colors[role] || "#757575";
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: "Business Admin",
      manager: "Manager",
      accountant: "Accountant",
      viewer: "Viewer",
      custom: "Custom Role",
    };
    return labels[role] || role;
  };

  const renderSubUser = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.fullName || "No Name"}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: getRoleBadgeColor(item.role) },
          ]}
        >
          <Text style={styles.roleText}>{getRoleLabel(item.role)}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.isActive ? "#4CAF50" : "#F44336" },
            ]}
          />
          <Text style={styles.statusText}>
            {item.isActive ? "Active" : "Inactive"}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
          >
            <MaterialIcons name="edit" size={20} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item._id)}
          >
            <MaterialIcons name="delete" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (!isMainUser()) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <MaterialIcons name="person-add" size={24} color="#FFF" />
        <Text style={styles.createButtonText}>Add Sub-User</Text>
      </TouchableOpacity>

      <FlatList
        data={subUsers}
        renderItem={renderSubUser}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadSubUsers}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No sub-users yet</Text>
            <Text style={styles.emptySubtext}>
              Add team members to help manage your business
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  createButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#666",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#BBB",
    marginTop: 8,
    textAlign: "center",
  },
});

export default SubUserManagementScreen;
```

---

## Backward Compatibility

### How It Works Without Breaking Existing Functionality

1. **Existing Main Users**: No changes needed - they continue to work exactly as before
2. **API Responses**: Backward compatible - existing apps ignore new fields
3. **Permission Checks**: If permission check fails, defaults to allowing for main users
4. **Gradual Migration**: You can update screens one by one

### Migration Strategy

```javascript
// BEFORE (Your existing code)
const InvoiceScreen = () => {
  const handleDelete = (id) => {
    // Delete logic
  };

  return (
    <TouchableOpacity onPress={() => handleDelete(invoiceId)}>
      <Text>Delete</Text>
    </TouchableOpacity>
  );
};

// AFTER (With permissions)
const InvoiceScreen = () => {
  const { canDelete } = usePermissions();

  const handleDelete = (id) => {
    if (canDelete("invoices")) {
      // Delete logic
    } else {
      Alert.alert("Permission denied");
    }
  };

  return (
    <PermissionGuard resource="invoices" action="delete">
      <TouchableOpacity onPress={() => handleDelete(invoiceId)}>
        <Text>Delete</Text>
      </TouchableOpacity>
    </PermissionGuard>
  );
};
```

### Gradual Implementation Steps

1. **Phase 1**: Add Context/State Management

   - Implement AuthContext with permission methods
   - No visual changes yet

2. **Phase 2**: Update Auth Flow

   - Handle sub-user login responses
   - Store user type and permissions

3. **Phase 3**: Add UI Components

   - Create PermissionGuard, PermissionButton
   - No integration yet

4. **Phase 4**: Integrate Screen by Screen

   - Start with non-critical screens
   - Test thoroughly before moving to next

5. **Phase 5**: Add Sub-User Management
   - Create sub-user screens (main user only)
   - Test creation, editing, deletion

---

## Complete Examples

### App.js Setup

```javascript
// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider } from "./src/context/AuthContext";
import MainNavigator from "./src/navigation/MainNavigator";

const Stack = createNativeStackNavigator();

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

### Navigation Setup

```javascript
// src/navigation/MainNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import SubUserManagementScreen from "../screens/SubUserManagementScreen";
import CreateSubUserScreen from "../screens/CreateSubUserScreen";

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Or loading screen
  }

  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="SubUserManagement"
            component={SubUserManagementScreen}
            options={{ title: "Team Members" }}
          />
          <Stack.Screen
            name="CreateSubUser"
            component={CreateSubUserScreen}
            options={{ title: "Add Team Member" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator;
```

### Login Screen Example

```javascript
// src/screens/LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      // Navigation is handled by MainNavigator
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error.response?.data?.message || "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Invoice App</Text>
      <Text style={styles.subtitle}>Login to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.infoText}>
        Login as main user or sub-user with your credentials
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  infoText: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    marginTop: 24,
  },
});

export default LoginScreen;
```

---

## Testing Checklist

### Before Deployment

- [ ] Main users can still login and access all features
- [ ] Sub-users can login with their credentials
- [ ] Business admins have full access (except sub-user management)
- [ ] Managers have correct limited access
- [ ] Accountants can access financial features
- [ ] Viewers can only read, not modify
- [ ] Custom roles work as configured
- [ ] Permission buttons hide/disable correctly
- [ ] PermissionGuard components work properly
- [ ] Sub-user creation works (main user only)
- [ ] Sub-user editing works (main user only)
- [ ] Sub-user deletion works (main user only)
- [ ] Permission changes reflect immediately
- [ ] Token expiration handled correctly
- [ ] Logout works for all user types
- [ ] Navigation guards work properly
- [ ] Error messages are user-friendly

---

## Troubleshooting

### Common Issues

1. **User data not loading after login**

   - Check AsyncStorage permissions
   - Verify token is being stored correctly
   - Check API response format

2. **Permissions not updating**

   - Force re-login after permission changes
   - Call `refreshUser()` from context
   - Clear app data and re-login

3. **Sub-user can't login**

   - Verify `isActive` is true
   - Check email/password are correct
   - Verify backend auth endpoint supports sub-users

4. **Permission check always returns false**
   - Check user data structure
   - Verify permissions object exists
   - Console log user object for debugging

---

## Next Steps

1. Implement AuthContext in your app
2. Create the API service files
3. Add the custom hooks
4. Create the UI components
5. Update one screen at a time
6. Test thoroughly before production
7. Train users on new permission system

## Support

For questions or issues with integration:

- Review the backend docs: `PERMISSION_SYSTEM.md`
- Check the quick reference: `PERMISSION_QUICK_REFERENCE.md`
- See implementation changes: `PERMISSION_SYSTEM_CHANGES.md`
