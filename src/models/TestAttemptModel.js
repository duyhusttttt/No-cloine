const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  options: { 
    type: [String], 
    validate: [arrayLimit, 'Options must have exactly 4 items'] 
  },
  correct_answer: { type: String, required: true },
  user_answer: { type: String } // Thêm trường này để lưu đáp án người dùng
});

function arrayLimit(val) {
  return val.length === 4;
}

const testAttemptSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  attempt_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true }, // Thêm trường user_id để liên kết
  questions: [questionSchema],
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TestAttempt', testAttemptSchema);