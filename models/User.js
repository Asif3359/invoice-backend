const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    // unique: true automatically creates an index, so we don't need userSchema.index({ email: 1 })
  },
  passwordHash: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  resetToken: {
    type: String
  },
  resetTokenExpires: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries (email index is automatically created by unique: true)
userSchema.index({ verificationToken: 1 });
userSchema.index({ resetToken: 1 });

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to hash password (static method)
userSchema.statics.hashPassword = async function(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.verificationToken;
  delete obj.resetToken;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

