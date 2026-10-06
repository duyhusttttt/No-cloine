const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const cardSchema = new mongoose.Schema({
  card_id: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4
  },
  hashed_student_id: {
    type: String,
    default: null
  },
  user_id: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['nurse', 'elderly'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'revoked', 'lost'],
    default: 'active'
  },
  issued_by: {
    type: String,
    default: 'Green Card Company'
  },
  issued_at: {
    type: Date,
    default: Date.now
  },
  expired_at: {
    type: Date,
    default: null
  },
  last_used_at: {
    type: Date,
    default: null
  },
  public_key: {
    type: String,
    required: true
  },
  private_key_encrypted: {
    type: String,
    required: true
  },
  qr_code_data: {
    type: String,
    required: true,
    match: /^data:image\/(?:[a-zA-Z+\-.]+);base64,[A-Za-z0-9+/=]+$/
  },
  signature: {
    type: String,
    required: true
  },
   balance: {
    type: Number,
    required: true,
    default: 0,              // Khởi tạo số dư = 0
    description: 'Số dư token/VND trong ví'
  }
}, {
  collection: 'cards',
  timestamps: true,
  strict: true
});

// Virtual to compute role if not set
cardSchema.pre('validate', function(next) {
  if (!this.role) {
    this.role = this.hashed_student_id ? 'nurse' : 'elderly';
  }
  if (!this.signature) {
    this.signature = `${this.hashed_student_id || ''}${this.card_id}${this.user_id || ''}`;
  }
  next();
});

// Set expired_at automatically for nurse if not provided
cardSchema.pre('save', function(next) {
  if (this.role === 'nurse' && !this.expired_at) {
    // +2 years in ms
    this.expired_at = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);
  }
  next();
});

const Card = mongoose.model('Card', cardSchema);
module.exports = Card;
