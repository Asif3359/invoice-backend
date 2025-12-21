const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { FULL_PERMISSIONS } = require("../config/permissions");

const subUserSchema = new mongoose.Schema(
  {
    parentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // index: true is set below in compound index
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
      // unique: true automatically creates an index, so we don't need subUserSchema.index({ email: 1 })
    },
    passwordHash: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      default: "viewer",
      // 'admin' = Business Admin (has all permissions like the business owner)
      // 'manager' = Can manage most resources but not delete
      // 'accountant' = Focus on financial operations
      // 'viewer' = Read-only access
      // 'custom' = Fully customizable permissions
    },
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Example structure:
      // {
      //   invoices: { create: true, read: true, update: true, delete: false, export: true },
      //   products: { create: false, read: true, update: false, delete: false, export: true, import: false },
      //   payments: { create: true, read: true, update: false, delete: false, export: true }
      // }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries (email index is automatically created by unique: true)
subUserSchema.index({ parentUserId: 1, email: 1 });

// Method to compare password
subUserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to hash password (static method)
subUserSchema.statics.hashPassword = async function (password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Method to check permission
subUserSchema.methods.hasPermission = function (resource, action) {
  // Business Admin (role: 'admin') has all permissions like the business owner
  if (this.role === "admin") {
    return true;
  }

  // Check if user is inactive
  if (!this.isActive) {
    return false;
  }

  // Check custom permissions
  if (!this.permissions || !this.permissions[resource]) {
    return false;
  }
  return this.permissions[resource][action] === true;
};

// Method to get effective permissions (useful for frontend)
subUserSchema.methods.getEffectivePermissions = function () {
  // Business Admin gets full permissions
  if (this.role === "admin") {
    return FULL_PERMISSIONS;
  }

  // Return the user's permissions
  return this.permissions || {};
};

// Method to check if user is business admin
subUserSchema.methods.isBusinessAdmin = function () {
  return this.role === "admin" && this.isActive;
};

// Remove sensitive fields from JSON output
subUserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const SubUser = mongoose.model("SubUser", subUserSchema);

module.exports = SubUser;
