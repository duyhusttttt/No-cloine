const mongoose = require('mongoose');


const surveyQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const surveyAttemptSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    elderly_id: { type: String, required: true, ref: "Elderly" },
    attempt_id: { type: String, required: true, unique: true },
    questions: [surveyQuestionSchema],
    verified: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const SurveyAttempt = mongoose.model('SurveyAttempt', surveyAttemptSchema);
module.exports = SurveyAttempt;