/**
 * Permission Configuration
 * Defines all available resources and actions in the system
 */

// All available resources in the system
const RESOURCES = {
  INVOICES: "invoices",
  PRODUCTS: "products",
  PAYMENTS: "payments",
  PURCHASES: "purchases",
  PURCHASE_ORDERS: "purchaseOrders",
  EXPENSES: "expenses",
  DELIVERY_NOTES: "deliveryNotes",
  CREDIT_NOTES: "creditNotes",
  ASSOCIATES: "associates",
  COMMISSION_AGENTS: "commissionAgents",
  COMMISSION_HISTORY: "commissionHistory",
  INVENTORY: "inventory",
  WAREHOUSES: "warehouses",
  STOCK_TRANSFERS: "stockTransfers",
  PHYSICAL_STOCK_TAKE: "physicalStockTake",
  CASH_REGISTERS: "cashRegisters", // ✅ NEW
  SUB_USERS: "subUsers",
  REPORTS: "reports",
  SETTINGS: "settings",
};

// All available actions
const ACTIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  EXPORT: "export",
  IMPORT: "import",
};

// Full permissions object (all resources with all actions)
const FULL_PERMISSIONS = {
  [RESOURCES.INVOICES]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.PRODUCTS]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
    [ACTIONS.IMPORT]: true,
  },
  [RESOURCES.PAYMENTS]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.PURCHASES]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.PURCHASE_ORDERS]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.EXPENSES]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.DELIVERY_NOTES]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.CREDIT_NOTES]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.ASSOCIATES]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.COMMISSION_AGENTS]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.COMMISSION_HISTORY]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.INVENTORY]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.WAREHOUSES]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.STOCK_TRANSFERS]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.PHYSICAL_STOCK_TAKE]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.CASH_REGISTERS]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.SUB_USERS]: {
    [ACTIONS.CREATE]: true,
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
    [ACTIONS.DELETE]: true,
  },
  [RESOURCES.REPORTS]: {
    [ACTIONS.READ]: true,
    [ACTIONS.EXPORT]: true,
  },
  [RESOURCES.SETTINGS]: {
    [ACTIONS.READ]: true,
    [ACTIONS.UPDATE]: true,
  },
};

// Predefined role permissions
const ROLE_PERMISSIONS = {
  admin: FULL_PERMISSIONS, // Business Admin - has everything like the owner

  manager: {
    [RESOURCES.INVOICES]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.PRODUCTS]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
      [ACTIONS.IMPORT]: true,
    },
    [RESOURCES.PAYMENTS]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.PURCHASES]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.PURCHASE_ORDERS]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.EXPENSES]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.DELIVERY_NOTES]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.CREDIT_NOTES]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.ASSOCIATES]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.COMMISSION_AGENTS]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.COMMISSION_HISTORY]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.INVENTORY]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.WAREHOUSES]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.STOCK_TRANSFERS]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.PHYSICAL_STOCK_TAKE]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.CASH_REGISTERS]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.SUB_USERS]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
    },
    [RESOURCES.REPORTS]: {
      [ACTIONS.READ]: true,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.SETTINGS]: {
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
    },
  },

  accountant: {
    [RESOURCES.INVOICES]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.PRODUCTS]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
      [ACTIONS.IMPORT]: false,
    },
    [RESOURCES.PAYMENTS]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.PURCHASES]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.PURCHASE_ORDERS]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.EXPENSES]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.DELIVERY_NOTES]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.CREDIT_NOTES]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.ASSOCIATES]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.COMMISSION_AGENTS]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.COMMISSION_HISTORY]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.INVENTORY]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.WAREHOUSES]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.STOCK_TRANSFERS]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.PHYSICAL_STOCK_TAKE]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.CASH_REGISTERS]: {
      [ACTIONS.CREATE]: true,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: true,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.SUB_USERS]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: false,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
    },
    [RESOURCES.REPORTS]: {
      [ACTIONS.READ]: true,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.SETTINGS]: {
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
    },
  },

  viewer: {
    [RESOURCES.INVOICES]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.PRODUCTS]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
      [ACTIONS.IMPORT]: false,
    },
    [RESOURCES.PAYMENTS]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.PURCHASES]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.PURCHASE_ORDERS]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.EXPENSES]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.DELIVERY_NOTES]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.CREDIT_NOTES]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: true,
    },
    [RESOURCES.ASSOCIATES]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: false,
    },
    [RESOURCES.COMMISSION_AGENTS]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: false,
    },
    [RESOURCES.COMMISSION_HISTORY]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: false,
    },
    [RESOURCES.INVENTORY]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: false,
    },
    [RESOURCES.WAREHOUSES]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: false,
    },
    [RESOURCES.STOCK_TRANSFERS]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: false,
    },
    [RESOURCES.PHYSICAL_STOCK_TAKE]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: false,
    },
    [RESOURCES.CASH_REGISTERS]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
      [ACTIONS.EXPORT]: false,
    },
    [RESOURCES.SUB_USERS]: {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: false,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false,
    },
    [RESOURCES.REPORTS]: {
      [ACTIONS.READ]: true,
      [ACTIONS.EXPORT]: false,
    },
    [RESOURCES.SETTINGS]: {
      [ACTIONS.READ]: true,
      [ACTIONS.UPDATE]: false,
    },
  },
};

/**
 * Get default permissions for a role
 * @param {String} role - Role name
 * @returns {Object} Permissions object
 */
const getDefaultPermissionsForRole = (role) => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
};

/**
 * Merge custom permissions with default role permissions
 * @param {String} role - Role name
 * @param {Object} customPermissions - Custom permissions to override defaults
 * @returns {Object} Merged permissions object
 */
const mergePermissions = (role, customPermissions = {}) => {
  const defaultPermissions = getDefaultPermissionsForRole(role);

  // Deep merge custom permissions with defaults
  const merged = JSON.parse(JSON.stringify(defaultPermissions));

  Object.keys(customPermissions).forEach((resource) => {
    if (!merged[resource]) {
      merged[resource] = {};
    }
    Object.keys(customPermissions[resource]).forEach((action) => {
      merged[resource][action] = customPermissions[resource][action];
    });
  });

  return merged;
};

module.exports = {
  RESOURCES,
  ACTIONS,
  FULL_PERMISSIONS,
  ROLE_PERMISSIONS,
  getDefaultPermissionsForRole,
  mergePermissions,
};
