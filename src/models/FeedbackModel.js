const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const feedbackSchema = new mongoose.Schema({
  _id: { type: String, required: true, default: uuidv4 },
  from_user_id_elderly: { type: String, required: true, ref: 'Elderly' }, // ID của người gửi feedback (elderly)
  to_user_id_nurse: { type: String, required: true, ref: 'Nurse' }, // ID của người nhận feedback (nurse)
  matching_id: { type: String, required: true, ref: 'Matching' }, // ID của dịch vụ/chăm sóc liên quan (có thể là matching_id)
  rating: { type: Number, required: true, min: 1, max: 5 }, // Điểm đánh giá từ 1-5 sao
  title: { type: String, nullable: true }, // Tiêu đề ngắn (tuỳ chọn)
  comment: { type: String, required: true }, // Nội dung nhận xét
  createdAt: { type: Date, default: Date.now },
  is_verified: { type: Boolean, default: false }, // Feedback có được xác minh là hợp lệ không
  report_flag: { type: Boolean, default: false }, // Có bị báo cáo là giả mạo hoặc không trung thực không
  report_reason: { type: String, nullable: true }, // Lý do nếu bị report
  service_level: { type: String, enum: ["basic", "standard", "premium"], required: true }, // Mức dịch vụ liên quan đến feedback
  ai_sentiment_analysis: { type: String, enum: ["positive", "negative", "neutral", "pending"], default: "pending" } // Kết quả phân tích cảm xúc từ model AI
}, {
  collection: 'feedbacks',
  timestamps: { createdAt: 'createdAt', updatedAt: false }
});

module.exports = mongoose.model('Feedback', feedbackSchema);