const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const disputeSchema = new mongoose.Schema({
  _id: { type: String, required: true, default: uuidv4 }, 
  dispute_id: { type: String, required: true, unique: true, default: uuidv4 },
  transaction_id: { type: String, ref: 'Transaction', required: true },
  complainant_id: { type: String, required: true }, // ID người gửi khiếu nại (elderly hoặc nurse)
  complainant_role: { type: String, enum: ['elderly', 'nurse'], required: true },
  defendant_id: { type: String, required: true }, // ID người bị khiếu nại (elderly hoặc nurse)
   defendant_role: { type: String, enum: ['elderly', 'nurse'], required: true },
  reason: { type: String, required: true },
  evidences: { type: [String], default: [] }, // Link hình ảnh, file bằng chứng
  status: { type: String, enum: ["open", "under_review", "resolved", "rejected"], default: "open", required: true },
  resolution: { type: String, nullable: true }, // Cách xử lý (phạt tiền, refund, ban...)
  created_at: { type: Date, default: Date.now },
  resolved_at: { type: Date, nullable: true }
}, {
  collection: 'disputes',
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

module.exports = mongoose.model('Dispute', disputeSchema);