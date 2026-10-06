const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Định nghĩa schema cơ bản cho người dùng
const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  role: {
    type: String,
    required: true,
    enum: ['nurse', 'elderly']
  },
  // Chỉ lưu password khi role = elderly
  password: {
    type: String,
    minlength: 8,
    required: function() { return this.role === 'elderly'; }
  },
  // Chỉ lưu student_id khi role = nurse
  student_id: {
    type: String,
    required: function() { return this.role === 'nurse'; },
    unique: true,
    trim: true
  },
  email_verified: {
    type: Boolean,
    default: false
  }
}, {
  discriminatorKey: 'role',
  timestamps: true
});


const User = mongoose.model('User', userSchema);

// Chỉ định các field bổ sung cho từng role (nếu cần mở rộng)
const Nurse = User.discriminator('nurse', new mongoose.Schema({}, { _id: false }));
const Elderly = User.discriminator('elderly', new mongoose.Schema({}, { _id: false }));

module.exports = { User, Nurse, Elderly };
