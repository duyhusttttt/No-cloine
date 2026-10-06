const mongoose = require('mongoose');

const testQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  options: {
    type: [String],
    validate: [arr => arr.length === 4, 'Options must have exactly 4 items'],
    required: true
  },
  correct_answer: { type: String, required: true }
});

module.exports = mongoose.model('TestQuestion', testQuestionSchema);