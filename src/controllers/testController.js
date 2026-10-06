const {createTestAttemptService,calculateTestResultService,getTestResultsByUserService} = require('../services/testService');
const ApiError = require('../utils/apiError');
const { addTestQuestionsService } = require('../services/testService');
// Submit Test Attempt
const submitTest = async (req, res, next) => {
  try {
    const { questions } = req.body;
    const attempt = await createTestAttemptService(req.user.user_id, questions);
    const result = await calculateTestResultService(attempt._id);
    res.status(201).json(result);
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

// Get User's Test History
const getTestHistory = async (req, res, next) => {
  try {
    const results = await getTestResultsByUserService(req.user.user_id);
    res.status(200).json(results);
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

const addTestQuestions = async (req, res, next) => {
  try {
    const { questions } = req.body;
    const inserted = await addTestQuestionsService(questions);
    res.status(201).json({ success: true, data: inserted });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitTest,
  getTestHistory,
  addTestQuestions
};