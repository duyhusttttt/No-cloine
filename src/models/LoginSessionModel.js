const mongoose = require('mongoose');

const loginSessionSchema = new mongoose.Schema({
  user_id: {
    type: String,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['nurse', 'elderly'],
    required: true
  },
  card_id: {
    type: String,
    default: null
  },
  signature: {
    type: String,
    default: null
  },
  token: {
    type: String,
    unique: true,
    required: true
  },
  login_time: {
    type: Date,
    default: Date.now,
    index: true
  },
  logout_time: {
    type: Date,
    default: null,
    index: true
  }
}, {
  collection: 'login_collection',
  timestamps: false
});

// Composite index để nhanh truy vấn active session
loginSessionSchema.index({ user_id: 1, logout_time: 1 });

const LoginSession = mongoose.model('LoginSession', loginSessionSchema);
module.exports = LoginSession;