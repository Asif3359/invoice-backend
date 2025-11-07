const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const subUserSchema = new mongoose.Schema({
  parentUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // index: true is set below in compound index
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    // unique: true automatically creates an index, so we don't need subUserSchema.index({ email: 1 })
  },
  passwordHash: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'manager', 'viewer', 'accountant'],
    default: 'viewer'
  },
  permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    // Example structure:
    // {
    //   invoices: { create: true, read: true, update: true, delete: false },
    //   products: { create: false, read: true, update: false, delete: false },
    //   payments: { create: true, read: true, update: false, delete: false }
    // }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries (email index is automatically created by unique: true)
subUserSchema.index({ parentUserId: 1, email: 1 });

// Method to compare password
subUserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to hash password (static method)
subUserSchema.statics.hashPassword = async function(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Method to check permission
subUserSchema.methods.hasPermission = function(resource, action) {
  if (!this.permissions || !this.permissions[resource]) {
    return false;
  }
  return this.permissions[resource][action] === true;
};

// Remove sensitive fields from JSON output
subUserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const SubUser = mongoose.model('SubUser', subUserSchema);

module.exports = SubUser;

