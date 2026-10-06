const mongoose = require('mongoose');

const questionDetailSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correct_answer: String,
  user_answer: String,
  is_correct: Boolean
});

const testResultSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  attempt_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true }, // Thêm trường user_id
  total_questions: { type: Number, min: 1 },
  correct_answers: { type: Number, min: 0 },
  score: { type: Number, min: 0, max: 100 },
  current_score: { type: Number, min: 0, max: 100 },
  average_score: { type: Number, min: 0, max: 100 },
  question_details: [questionDetailSchema],
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TestResult', testResultSchema);