const mongoose = require('mongoose');

// Sub-schema cho lịch sử thay đổi trạng thái
const historyLogSchema = new mongoose.Schema({
  action:      { type: String},
  modified_by: { type: String },
  timestamp:   { type: Date }
}, { _id: false });

// Sub-schema cho chi tiết thanh toán
const paymentDetailsSchema = new mongoose.Schema({
   transaction_id: { type: String, ref: 'Transaction' },
  service_level:            { type: String, enum: ['basic','standard','premium'], default: null },
  price_per_hour:           { type: Number, default: null },
  total_hours_booked:       { type: Number, default: null },
  deposit_amount:           { type: Number, default: null },
  remaining_payment:        { type: Number, default: null },
  nurse_share_percentage:   { type: Number, default: null },
  platform_share_percentage:{ type: Number, default: null },
  nurse_total_earnings:     { type: Number, default: null },
  platform_total_earnings:  { type: Number, default: null },
  currency:                 { type: String, enum: ['VND','PlatformToken'], default: 'VND' } 
}, { _id: false });

const contractSchema = new mongoose.Schema({
  matching_id:       { type: String, ref: 'Matching', required: true, unique: true },
  elderly_id:        { type: String, ref: 'Elderly',  required: true },
  nurse_id:          { type: String, ref: 'Nurse',    required: true },
  contract_hash:     { type: String, default: null },
  signed_at:         { type: Date,   default: null },
  status:            { type: String, enum: ['pending','active','violated','terminated'], default: 'pending' },
  signed_by_elderly: { type: Date,   default: null },
  signed_by_nurse:   { type: Date,   default: null },
  elderly_signature: { type: Boolean, default: false },
  nurse_signature:   { type: Boolean, default: false },

  // Template hợp đồng sẵn
  terms: {
    type: [String],
    default: [
      'Elderly phải thanh toán trước 50% giá trị hợp đồng.',
      'Nurse sẽ nhận 75% doanh thu, platform giữ 25%.',
      'Hợp đồng có hiệu lực từ effective_date đến expiry_date.'
    ]
  },
  payment_details:   { type: paymentDetailsSchema, default: {} },
  effective_date:    { type: Date, default: null },
  expiry_date:       { type: Date, default: null },

  created_by:        { type: String, required: true, default: 'system' },
  last_modified_at:  { type: Date,   default: Date.now },
  history_logs:      { type: [historyLogSchema], default: [] }
}, {
  collection: 'contracts',
  timestamps: { createdAt: false, updatedAt: 'last_modified_at' },
  strict: true
});

// Mỗi lần save, nếu status thay đổi hoặc ký xong, thêm log
contractSchema.pre('save', function(next) {
  const now = new Date();
  if (this.isModified('status')) {
    this.history_logs.push({ action: this.status, modified_by: this.created_by, timestamp: now });
  }
  if (this.isModified('signed_by_elderly')) {
    this.history_logs.push({ action: 'elderly_signed', modified_by: this.elderly_id, timestamp: now });
  }
  if (this.isModified('signed_by_nurse')) {
    this.history_logs.push({ action: 'nurse_signed', modified_by: this.nurse_id, timestamp: now });
  }
  next();
});

module.exports = mongoose.model('Contract', contractSchema);
