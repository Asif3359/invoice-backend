const { verifyAccessToken } = require('../utils/tokenGenerator');
const User = require('../models/User');
const SubUser = require('../models/SubUser');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please provide a valid authentication token.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }

    // Fetch user based on userType
    let user;
    if (decoded.userType === 'sub') {
      user = await SubUser.findById(decoded.userId).populate('parentUserId', 'email fullName');
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Sub-user not found or inactive'
        });
      }
    } else {
      user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }
    }

    // Attach user to request
    req.user = user;
    req.userType = decoded.userType;
    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.'
    });
  }
};

module.exports = authenticate;

