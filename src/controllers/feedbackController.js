// src/controllers/feedbackController.js
const feedbackService = require('../services/feedbackService'); // Import dịch vụ phản hồi
const ApiError = require('../utils/apiError');

// Controller để gửi phản hồi mới (Elderly)
const submitFeedback = async (req, res, next) => {
  try {
    const { to_user_id_nurse, matching_id, rating, title, comment } = req.body;
    // from_user_id sẽ được lấy từ req.user sau khi middleware auth hoạt động
    const from_user_id_elderly = req.user.user_id; // Giả định user_id của người dùng hiện tại là from_user_id

    const newFeedback = await feedbackService.submitFeedbackService({
      from_user_id_elderly,
      to_user_id_nurse,
      matching_id,
      rating,
      title,
      comment
    });
    res.status(201).json({ success: true, data: newFeedback });
  } catch (err) {
    next(err);
  }
};

// Controller để lấy lịch sử phản hồi của người dùng (Elderly hoặc Nurse)
const getUserFeedbacks = async (req, res, next) => {
  try {
    const userId = req.user.user_id; // Lấy ID của người dùng từ token
    const role = req.user.role;     // Lấy vai trò của người dùng từ token

    const { page, limit } = req.query;
    const result = await feedbackService.getUserFeedbacksService(userId, role, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// // Controller để xử lý việc cập nhật sentiment (có thể gọi nội bộ từ trigger hoặc admin)
// // Nếu bạn muốn API này chỉ được gọi bởi một trigger Realm Function hoặc là private API
// // thì không cần expose nó ra router public.
// const processSentimentAnalysis = async (req, res, next) => {
//     try {
//         const { feedbackId, comment } = req.body; // Hoặc từ params nếu là PATCH /feedbacks/:id/analyze
//         // Cần xác thực hoặc chỉ cho phép gọi từ internal system/trigger
//         if (!feedbackId || !comment) {
//             throw new ApiError(400, "Feedback ID and comment are required.");
//         }
//         const updatedFeedback = await feedbackService.processFeedbackSentiment(feedbackId, comment);
//         res.status(200).json({ success: true, data: updatedFeedback });
//     } catch (err) {
//         next(err);
//     }
// };


module.exports = {
  submitFeedback,
  getUserFeedbacks,
  // processSentimentAnalysis
};