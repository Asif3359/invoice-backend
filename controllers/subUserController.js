const { validationResult } = require('express-validator');
const SubUser = require('../models/SubUser');
const User = require('../models/User');

/**
 * Create a new sub-user
 */
const createSubUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, fullName, role, permissions } = req.body;
    const parentUserId = req.userId; // From authenticate middleware

    // Check if email already exists
    const existingSubUser = await SubUser.findOne({ email: email.toLowerCase() });
    if (existingSubUser) {
      return res.status(409).json({
        success: false,
        message: 'Sub-user with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await SubUser.hashPassword(password);

    // Create sub-user
    const subUser = new SubUser({
      parentUserId,
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      role: role || 'viewer',
      permissions: permissions || {}
    });

    await subUser.save();
    await subUser.populate('parentUserId', 'email fullName');

    res.status(201).json({
      success: true,
      message: 'Sub-user created successfully',
      data: {
        subUser: {
          ...subUser.toJSON(),
          parentUser: subUser.parentUserId
        }
      }
    });
  } catch (error) {
    console.error('Create sub-user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sub-user'
    });
  }
};

/**
 * Get all sub-users for the current main user
 */
const getSubUsers = async (req, res) => {
  try {
    const parentUserId = req.userId;

    const subUsers = await SubUser.find({ parentUserId })
      .populate('parentUserId', 'email fullName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        subUsers: subUsers.map(subUser => ({
          ...subUser.toJSON(),
          parentUser: subUser.parentUserId
        }))
      }
    });
  } catch (error) {
    console.error('Get sub-users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sub-users'
    });
  }
};

/**
 * Get a single sub-user by ID
 */
const getSubUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const parentUserId = req.userId;

    const subUser = await SubUser.findOne({
      _id: id,
      parentUserId
    }).populate('parentUserId', 'email fullName');

    if (!subUser) {
      return res.status(404).json({
        success: false,
        message: 'Sub-user not found'
      });
    }

    res.json({
      success: true,
      data: {
        subUser: {
          ...subUser.toJSON(),
          parentUser: subUser.parentUserId
        }
      }
    });
  } catch (error) {
    console.error('Get sub-user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sub-user'
    });
  }
};

/**
 * Update a sub-user
 */
const updateSubUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const parentUserId = req.userId;
    const { fullName, role, permissions, isActive } = req.body;

    const subUser = await SubUser.findOne({
      _id: id,
      parentUserId
    });

    if (!subUser) {
      return res.status(404).json({
        success: false,
        message: 'Sub-user not found'
      });
    }

    // Update fields
    if (fullName !== undefined) subUser.fullName = fullName;
    if (role !== undefined) subUser.role = role;
    if (permissions !== undefined) subUser.permissions = permissions;
    if (isActive !== undefined) subUser.isActive = isActive;

    await subUser.save();
    await subUser.populate('parentUserId', 'email fullName');

    res.json({
      success: true,
      message: 'Sub-user updated successfully',
      data: {
        subUser: {
          ...subUser.toJSON(),
          parentUser: subUser.parentUserId
        }
      }
    });
  } catch (error) {
    console.error('Update sub-user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sub-user'
    });
  }
};

/**
 * Update sub-user password
 */
const updateSubUserPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const parentUserId = req.userId;
    const { password } = req.body;

    const subUser = await SubUser.findOne({
      _id: id,
      parentUserId
    });

    if (!subUser) {
      return res.status(404).json({
        success: false,
        message: 'Sub-user not found'
      });
    }

    // Hash new password
    const passwordHash = await SubUser.hashPassword(password);
    subUser.passwordHash = passwordHash;
    await subUser.save();

    res.json({
      success: true,
      message: 'Sub-user password updated successfully'
    });
  } catch (error) {
    console.error('Update sub-user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sub-user password'
    });
  }
};

/**
 * Delete a sub-user
 */
const deleteSubUser = async (req, res) => {
  try {
    const { id } = req.params;
    const parentUserId = req.userId;

    const subUser = await SubUser.findOneAndDelete({
      _id: id,
      parentUserId
    });

    if (!subUser) {
      return res.status(404).json({
        success: false,
        message: 'Sub-user not found'
      });
    }

    res.json({
      success: true,
      message: 'Sub-user deleted successfully'
    });
  } catch (error) {
    console.error('Delete sub-user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sub-user'
    });
  }
};

module.exports = {
  createSubUser,
  getSubUsers,
  getSubUserById,
  updateSubUser,
  updateSubUserPassword,
  deleteSubUser
};

