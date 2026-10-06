const mongoose = require("mongoose");

const vitalSignsSchema = new mongoose.Schema({
  blood_pressure_systolic: { type: Number, required: true }, // mmHg
  blood_pressure_diastolic: { type: Number, required: true }, // mmHg
  pulse: { type: Number, required: true }, // lần/phút
  respiratory_rate: { type: Number, required: true }, // lần/phút
  temperature: { type: Number, required: true }, // °C
  oxygen_saturation: { type: Number, required: true }, // %
  weight: { type: Number }, // kg
  height: { type: Number }, // cm
});

const serviceLogSchema = new mongoose.Schema(
  {
    nurse_id: { type: String, required: true, ref: "Nurse" },
    elderly_id: { type: String, required: true, ref: "Elderly" },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    location: { type: String, required: true },
    tasks_performed: { type: [String], required: true },
    vital_signs: vitalSignsSchema,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: true } // Tự động cập nhật created_at và updated_at
);

// Thêm index để tối ưu truy vấn
serviceLogSchema.index({ nurse_id: 1, elderly_id: 1 });

module.exports = mongoose.model("ServiceLog", serviceLogSchema);