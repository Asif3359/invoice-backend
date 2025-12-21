/**
 * Authorization middleware
 * Checks if user has permission to perform action on resource
 */

/**
 * Check if user has permission for a specific resource and action
 * @param {String} resource - Resource name (e.g., 'invoices', 'products')
 * @param {String} action - Action name (e.g., 'create', 'read', 'update', 'delete')
 */
const hasPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      // Main users (business owners) have all permissions
      if (req.userType === "main") {
        return next();
      }

      // For sub-users, check permissions
      // Business admins (role: 'admin') also have all permissions
      if (req.userType === "sub") {
        const hasAccess = req.user.hasPermission(resource, action);

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: `You don't have permission to ${action} ${resource}`,
          });
        }
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({
        success: false,
        message: "Authorization check failed",
      });
    }
  };
};

/**
 * Check if user has a specific role
 * @param {Array<String>} roles - Allowed roles
 */
const hasRole = (...roles) => {
  return async (req, res, next) => {
    try {
      // Main users (business owners) can access everything
      if (req.userType === "main") {
        return next();
      }

      // For sub-users, check role
      // Business admins (role: 'admin') can access everything
      if (req.userType === "sub") {
        // If admin role is required or user is admin, allow access
        if (req.user.role === "admin" || roles.includes(req.user.role)) {
          return next();
        }

        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(" or ")}`,
        });
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      return res.status(500).json({
        success: false,
        message: "Role check failed",
      });
    }
  };
};

/**
 * Check if user is main user (not sub-user)
 * Note: This prevents even business admins from accessing certain routes
 */
const isMainUser = (req, res, next) => {
  if (req.userType !== "main") {
    return res.status(403).json({
      success: false,
      message: "This action is only available for main users (business owners)",
    });
  }
  next();
};

/**
 * Check if user is main user OR business admin
 * Business admins (sub-users with role 'admin') can also access these routes
 */
const isMainUserOrBusinessAdmin = (req, res, next) => {
  if (req.userType === "main") {
    return next();
  }

  if (req.userType === "sub" && req.user.isBusinessAdmin()) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message:
      "This action is only available for business owners or business admins",
  });
};

module.exports = {
  hasPermission,
  hasRole,
  isMainUser,
  isMainUserOrBusinessAdmin,
};
