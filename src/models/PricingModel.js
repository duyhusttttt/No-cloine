const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  service_level: {
    type: String,
    enum: ["basic", "standard", "premium"],
    required: true,
    unique: true
  },
  price_range: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  platform_share_percentage: {
    type: Number,
    required: true
  },
  nurse_share_percentage: {
    type: Number,
    required: true
  }
}, {
  collection: 'pricing',
  timestamps: false
});

const Pricing = mongoose.model('Pricing', pricingSchema);
module.exports = Pricing;