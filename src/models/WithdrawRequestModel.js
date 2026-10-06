const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const withdrawRequestSchema = new mongoose.Schema({
  _id: { type: String, required: true, default: uuidv4 },
  withdraw_request_id: { type: String, required: true, unique: true, default: uuidv4 },
  nurse_id: { type: String, ref: 'Nurse', required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["pending", "approved", "rejected", "completed"], default: "pending", required: true },
  bank_account_info: {
    type: Object,
    account_number: { type: String, required: true },
    bank_name: { type: String, required: true },
    crypto_address: { type: String, nullable: true }
  },
  requested_at: { type: Date, default: Date.now },
  processed_at: { type: Date, nullable: true }
}, {
  collection: 'withdraw_requests',
  timestamps: { createdAt: 'requested_at', updatedAt: false }
});

module.exports = mongoose.model('WithdrawRequest', withdrawRequestSchema);