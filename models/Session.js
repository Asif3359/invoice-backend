const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
    // index is set below in compound index
  },
  userType: {
    type: String,
    required: true,
    enum: ['main', 'sub'],
    default: 'main'
  },
  refreshToken: {
    type: String,
    required: true
    // index is set below
  },
  deviceInfo: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    // Example: { device: 'iPhone', os: 'iOS 15', browser: 'Safari' }
  },
  ipAddress: {
    type: String
  },
  expiresAt: {
    type: Date,
    required: true
    // TTL index is set below
  }
}, {
  timestamps: true
});

// Indexes
sessionSchema.index({ userId: 1, userType: 1 });
sessionSchema.index({ refreshToken: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic deletion

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;

