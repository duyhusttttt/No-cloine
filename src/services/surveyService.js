const SurveyAttempt = require("../models/SurveyAttemptModel");
const ApiError = require("../utils/apiError");
const Elderly = require("../models/ElderiesModel");
const Matching = require("../models/MatchingModel");

// 1. Submit Survey Attempt
const submitSurveyService = async (elderlyId, questions) => {
  // Validate input
  if (!questions || !Array.isArray(questions)) {
    throw new ApiError(400, "Questions must be an array");
  }

  // Kiểm tra elderly tồn tại bằng user_id (UUID)
  const elderlyExists = await Elderly.findOne({ user_id: elderlyId }); // Thay đổi ở đây
  if (!elderlyExists) throw new ApiError(404, "Elderly not found");

  const attempt = await SurveyAttempt.create({
    _id: `survey_${Date.now()}`,
    attempt_id: `survey_${Date.now()}`,
    elderly_id: elderlyExists._id,
    questions,
  });

  return attempt;
};

// 2. Verify Survey (Admin/System)
const verifySurveyService = async (attemptId) => {
  const survey = await SurveyAttempt.findOneAndUpdate(
    { attempt_id: attemptId, verified: false },
    { verified: true },
    { new: true }
  );

  if (!survey) {
    throw new ApiError(400, "Survey not found or already verified");
  }

  // Gọi pipeline tích hợp với matching (tham khảo schema)
  await Matching.aggregate([
    {
      $match: { elderly_id: survey.elderly_id },
    },
    {
      $lookup: {
        from: "surveyattempts",
        localField: "elderly_id",
        foreignField: "elderly_id",
        as: "surveys",
      },
    },
    {
      $merge: {
        into: "matching",
        on: "_id",
        whenMatched: "merge",
        whenNotMatched: "discard",
      },
    },
  ]);

  return survey;
};

// 3. Get Surveys by Elderly
const getSurveysByElderlyService = async (userId) => {
  const elderly = await Elderly.findOne({ user_id: userId });
  if (!elderly) throw new ApiError(404, "Elderly not found");

  return SurveyAttempt.find({ elderly_id: elderly._id }).sort({ timestamp: -1 });
};

module.exports = {
  submitSurveyService,
  verifySurveyService,
  getSurveysByElderlyService,
};