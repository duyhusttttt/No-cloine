// models/TransactionModel.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transaction_id:    { type: String, required: true, unique: true },
  elderly_id:        { type: String, required: true },
  nurse_id:          { type: String, required: true },
  amount:            { type: Number, required: true, min: 0 },
  currency:          { type: String, enum: ['VND','ETH','USDT','PlatformToken'], required: true },
  service_type:      { type: String, enum: ['basic','standard','premium'], required: true },
  platform_fee:      { type: Number, required: true, min: 0 },
  nurse_receive_amount: { type: Number, required: true, min: 0 },
  status:            { type: String, enum: ['pending','completed','failed','cancelled'], default: 'pending' },
  payment_method:    { type: String, enum: ['bank_transfer', 'smart_contract_transfer'], required: true },
  created_at:        { type: Date, default: Date.now },
  updated_at:        { type: Date, default: Date.now },
  contract_id: {
    type: String,
    ref: 'Contract'
  },
  withdraw_request_id: {
    type: String,
    ref: 'WithdrawRequest'
  },
  note: {
    type: String,
    nullable: true
  }
}, {
  collection: 'transactions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Transaction', transactionSchema);
