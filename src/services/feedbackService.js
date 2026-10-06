// src/services/feedbackService.js
const Feedback = require('../models/FeedbackModel'); 
const Elderly = require('../models/ElderiesModel'); 
const Nurse = require('../models/NurseModel'); 
const Matching = require('../models/MatchingModel'); 
const ApiError = require('../utils/apiError');
const axios = require('axios'); 
const { v4: uuidv4 } = require('uuid');

// // Hàm nội bộ gọi API AI để phân tích cảm xúc
// async function callAIApiForSentiment(comment) {
//   const aiApiUrl = process.env.AI_API_URL; // Đảm bảo URL này được đặt trong .env
//   if (!aiApiUrl) {
//     console.warn('AI_API_URL is not set in .env. Skipping actual AI call.');
//     return 'neutral'; // Fallback nếu không có API AI
//   }
//   try {
//     const response = await axios.post(aiApiUrl, { text: comment });
//     // Giả định API AI của bạn trả về một JSON object như { sentiment: "positive" }
//     const sentiment = response.data.sentiment;
//     if (!['positive', 'negative', 'neutral'].includes(sentiment)) {
//         console.warn(`AI API returned an unexpected sentiment: ${sentiment}. Defaulting to neutral.`);
//         return 'neutral';
//     }
//     return sentiment;
//   } catch (error) {
//     console.error('Error calling AI API for sentiment analysis:', error.message);
//     // Có thể log thêm chi tiết lỗi từ API response nếu có
//     return 'neutral'; // Trả về neutral nếu có lỗi khi gọi AI
//   }
// }

// Hàm cập nhật rating trung bình và tỷ lệ feedback cho y tá
const updateNurseRatings = async (nurseId) => {
  // Tìm tất cả feedback dành cho nurse này
  const feedbacks = await Feedback.find({ to_user_id_nurse: nurseId });

  let totalRating = 0;
  // let positiveCount = 0;
  // let negativeCount = 0;
  // let neutralCount = 0;

  feedbacks.forEach(fb => {
    totalRating += fb.rating;
    // if (fb.ai_sentiment_analysis === 'positive') positiveCount++;
    // else if (fb.ai_sentiment_analysis === 'negative') negativeCount++;
    // else neutralCount++;
  });

  const averageRating = feedbacks.length > 0 ? (totalRating / feedbacks.length).toFixed(2) : 0;
  // const ratioFeedbacks = negativeCount > 0 ? (positiveCount / negativeCount).toFixed(2) : positiveCount.toFixed(2); // Nếu không có negative, ratio là số positive

  await Nurse.findOneAndUpdate(
    { nurse_id: nurseId },
    {
      average_rating: averageRating,
      total_feedback_count: feedbacks.length,
      // ratio_feedbacks: ratioFeedbacks,
      // Có thể thêm các trường khác như total_positive_feedback, total_negative_feedback
    },
    { new: true, runValidators: true }
  );
  // console.log(`Nurse ${nurseId} ratings updated: Avg Rating ${averageRating}, Total Feedbacks ${feedbacks.length}, Ratio ${ratioFeedbacks}`); dùng khi có AI
   console.log(`Nurse ${nurseId} ratings updated: Avg Rating ${averageRating}, Total Feedbacks ${feedbacks.length}`); 
};

// Hàm để gửi phản hồi mới
const submitFeedbackService = async ({ from_user_id_elderly, to_user_id_nurse, matching_id, rating, title, comment }) => {
  // Validate đầu vào
  if (!from_user_id_elderly || !to_user_id_nurse || !matching_id || !rating || !comment) {
    throw new ApiError(400, 'All required fields (from_user_id_elderly, to_user_id_nurse, matching_id, rating, comment) must be provided.');
  }
  if (rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5.');
  }

  // Kiểm tra sự tồn tại của elderly và nurse
  const elderlyExists = await Elderly.findOne({ user_id: from_user_id_elderly });
  if (!elderlyExists) throw new ApiError(404, 'Elderly (from_user_id_elderly) not found.');
  const nurseExists = await Nurse.findOne({ nurse_id: to_user_id_nurse });
  if (!nurseExists) throw new ApiError(404, 'Nurse (to_user_id_nurse) not found.');

  // Lấy service_level từ matching (matching_id)
  const matching = await Matching.findById(matching_id); // Giả định matching_id là matching._id
  if (!matching) throw new ApiError(404, 'Service (matching) not found.');
  const serviceLevel = matching.service_level;

  const newFeedback = await Feedback.create({
    _id: uuidv4(), // Hoặc bạn có thể để MongoDB tự sinh ObjectId
    from_user_id_elderly: elderlyExists.elderly_id,
    to_user_id_nurse: nurseExists.nurse_id,
    matching_id: matching_id,
    rating,
    title: title || null,
    comment,
    service_level: serviceLevel,
    ai_sentiment_analysis: 'pending' // Đặt pending để trigger AI analysis
  });

  // Kích hoạt phân tích cảm xúc (có thể được xử lý bởi trigger Realm Function)
  // await processFeedbackSentiment(newFeedback._id, newFeedback.comment);

  // Cập nhật rating cho nurse ngay lập tức sau khi gửi feedback (hoặc bởi trigger)
  await updateNurseRatings(newFeedback.to_user_id_nurse);

  return newFeedback;
};

// Hàm để lấy lịch sử phản hồi của một người dùng (Elderly hoặc Nurse)
const getUserFeedbacksService = async (userId, role, { page = 1, limit = 20 }) => {
    const filter = {};
    if (role === 'elderly') {
        const elderlyProfile = await Elderly.findOne({ user_id: userId }).select('elderly_id');
        if (!elderlyProfile) throw new ApiError(404, 'Elderly profile not found.');
        filter.from_user_id_elderly = elderlyProfile.elderly_id; // Lọc theo ElderlyProfile.elderly_id
    } else if (role === 'nurse') {
        const nurseProfile = await Nurse.findOne({ user_id: userId }).select('nurse_id');
        if (!nurseProfile) throw new ApiError(404, 'Nurse profile not found.');
        filter.to_user_id_nurse = nurseProfile.nurse_id; // Lọc theo NurseProfile.nurse_id
    } else {
        throw new ApiError(403, 'Unauthorized access to feedbacks.');
    }

    const skip = (page - 1) * limit;
    const [feedbacks, total] = await Promise.all([
        Feedback.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Feedback.countDocuments(filter)
    ]);

    return { feedbacks, total, page, limit };
};

// // Hàm xử lý phân tích cảm xúc sau khi feedback được tạo
// // Hàm này có thể được gọi bởi Realm Function Trigger
// const processFeedbackSentiment = async (feedbackId, comment) => {
//     const sentimentResult = await callAIApiForSentiment(comment);
//     const updatedFeedback = await Feedback.findOneAndUpdate(
//         { _id: feedbackId },
//         { ai_sentiment_analysis: sentimentResult },
//         { new: true }
//     );

//     if (!updatedFeedback) {
//         throw new ApiError(404, 'Feedback not found for sentiment update.');
//     }
//     // Sau khi cập nhật sentiment, có thể kích hoạt cập nhật rating tổng thể của nurse
//     await updateNurseRatings(updatedFeedback.to_user_id);

//     return updatedFeedback;
// };


module.exports = {
  submitFeedbackService,
  getUserFeedbacksService,
  // processFeedbackSentiment // Export nếu Realm Function cần gọi từ bên ngoài
};