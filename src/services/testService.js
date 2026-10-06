const TestAttempt = require('../models/TestAttemptModel');
const TestResult = require('../models/TestResultModel');
const ApiError = require('../utils/apiError');
const TestQuestion = require('../models/TestQuestionModel '); 

// 1. Tạo Test Attempt
const createTestAttemptService = async (userId, questions) => {
  // Validate input
  if (!questions || !Array.isArray(questions)) {
    throw new ApiError(400, 'Invalid questions format');
  }

  const attempt = await TestAttempt.create({
    _id: `attempt_${Date.now()}`,
    attempt_id: `attempt_${Date.now()}`,
    user_id: userId,
    questions
  });

  return attempt;
};

// 2. Tính toán kết quả và lưu vào TestResult (Dùng Aggregation Pipeline từ schema)
const calculateTestResultService = async (attemptId) => {
  const pipeline = [
    {
      $match: { _id: attemptId }
    },
    {
      $addFields: {
        total_questions: { $size: "$questions" },
        correct_answers: {
          $size: {
            $filter: {
              input: "$questions",
              as: "q",
              cond: { $eq: ["$$q.user_answer", "$$q.correct_answer"] }
            }
          }
        }
      }
    },
    {
      $addFields: {
        score: { $multiply: [{ $divide: ["$correct_answers", "$total_questions"] }, 100] }
      }
    },
    {
      $lookup: {
        from: "testresults",
        localField: "attempt_id",
        foreignField: "attempt_id",
        as: "previous_attempts"
      }
    },
    {
      $addFields: {
        average_score: {
          $cond: {
            if: { $gt: [{ $size: "$previous_attempts" }, 0] },
            then: { 
              $divide: [
                { $sum: "$previous_attempts.score" },
                { $size: "$previous_attempts" }
              ]
            },
            else: "$score"
          }
        },
        current_score: "$score"
      }
    },
    {
      $project: {
        _id: 1,
        attempt_id: 1,
        user_id: 1,
        total_questions: 1,
        correct_answers: 1,
        score: 1,
        current_score: 1,
        average_score: 1,
        timestamp: 1,
        question_details: {
          $map: {
            input: "$questions",
            as: "q",
            in: {
              question: "$$q.question",
              options: "$$q.options",
              correct_answer: "$$q.correct_answer",
              user_answer: "$$q.user_answer",
              is_correct: { $eq: ["$$q.user_answer", "$$q.correct_answer"] }
            }
          }
        }
      }
    },
    {
      $merge: {
        into: "testresults",
        on: "attempt_id",
        whenMatched: "merge",
        whenNotMatched: "insert"
      }
    }
  ];

  const result = await TestAttempt.aggregate(pipeline);
  return result[0]; // Trả về document đã merge
};

// 3. Lấy kết quả test theo user
const getTestResultsByUserService = async (userId) => {
  return TestResult.find({ user_id: userId }).sort({ timestamp: -1 });
};

const addTestQuestionsService = async (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('questions is required and must be an array');
  }
  // Có thể thêm validate từng câu hỏi ở đây nếu muốn
  const inserted = await TestQuestion.insertMany(questions);
  return inserted;
};


module.exports = {
  createTestAttemptService,
  calculateTestResultService,
  getTestResultsByUserService,
  addTestQuestionsService,
};