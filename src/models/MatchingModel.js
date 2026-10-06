const mongoose = require('mongoose');

// Sub-schema cho booking time
const bookingTimeSchema = new mongoose.Schema({
  start_time: { type: Date, required: true },
  end_time:   { type: Date, required: true }
}, { _id: false });

// Sub-schema cho contract status
const contractStatusSchema = new mongoose.Schema({
  elderly_signature:  { type: String, default: null },
  nurse_signature:    { type: String, default: null },
  contract_hash:      { type: String, default: null },
  is_signed:          { type: Boolean, default: false }
}, { _id: false, required: true });

// Sub-schema cho violation report
const violationReportSchema = new mongoose.Schema({
  reported_by: { type: String, required: true },
  reason:      { type: String, required: true },
  timestamp:   { type: Date, required: true }
}, { _id: false });

const matchingSchema = new mongoose.Schema({
  nurse_id: {
    type: String,
    ref: 'Nurse',
    required: true
  },
  elderly_id: {
    type: String,
    ref: 'Elderly',
    required: true
  },
  service_level: {
    type: String,
    enum: ['basic', 'standard', 'premium'],
    required: true
  },
  booking_time: {
    type: [bookingTimeSchema],
    default: [],
    required: true
  },
  contract_status: {
    type: contractStatusSchema,
    required: true
  },
  violation_report: {
    type: violationReportSchema,
    default: null
  },
  isMatched: {
    type: Boolean,
    default: false
  },
  matchedAt: {
    type: Date,
    default: null
  },
  resetAt: {
    type: Date,
    required: true
  }
}, {
  collection: 'matching',
  timestamps: true,
  strict: true
});

module.exports = mongoose.model('Matching', matchingSchema);
