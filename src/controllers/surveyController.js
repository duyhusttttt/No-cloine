const ApiError = require("../utils/apiError");
const {submitSurveyService, verifySurveyService, getSurveysByElderlyService} = require("../services/surveyService");

// Submit Survey (Elderly)
const submitSurvey = async (req, res, next) => {
  try {
    const { questions } = req.body;
    const survey = await submitSurveyService(req.user.user_id, questions);
    res.status(201).json(survey);
  } catch (err) {
    next(new ApiError(err.statusCode || 500, err.message));
  }
};

// Verify Survey (Admin)
const verifySurvey = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const survey = await verifySurveyService(attemptId);
    res.status(200).json(survey);
  } catch (err) {
    next(new ApiError(err.statusCode || 500, err.message));
  }
};

// Get Survey History (Elderly/Admin)
const getSurveyHistory = async (req, res, next) => {
  try {
    const surveys = await getSurveysByElderlyService(req.user.user_id);
    res.status(200).json(surveys);
  } catch (err) {
    next(new ApiError(500, err.message));
  }
};

module.exports = {
  submitSurvey,
  verifySurvey,
  getSurveyHistory,
};
