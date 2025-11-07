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
      // Main users have all permissions
      if (req.userType === 'main') {
        return next();
      }

      // For sub-users, check permissions
      if (req.userType === 'sub') {
        const hasAccess = req.user.hasPermission(resource, action);
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: `You don't have permission to ${action} ${resource}`
          });
        }
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
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
      // Main users can access everything
      if (req.userType === 'main') {
        return next();
      }

      // For sub-users, check role
      if (req.userType === 'sub') {
        if (!roles.includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            message: `Access denied. Required role: ${roles.join(' or ')}`
          });
        }
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Role check failed'
      });
    }
  };
};

/**
 * Check if user is main user (not sub-user)
 */
const isMainUser = (req, res, next) => {
  if (req.userType !== 'main') {
    return res.status(403).json({
      success: false,
      message: 'This action is only available for main users'
    });
  }
  next();
};

module.exports = {
  hasPermission,
  hasRole,
  isMainUser
};

