// src/routes/feedbackRoute.js
const express = require('express');
const { auth, permit } = require('../middleware/auth');
const feedbackController = require('../controllers/feedbackController');

const router = express.Router();

/**
 * @swagger
 * tags:
 * - name: Feedbacks
 * description: Quản lý các phản hồi và phân tích cảm xúc
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FeedbackInput:
 *       type: object
 *       required:
 *         - to_user_id_nurse
 *         - matching_id
 *         - rating
 *         - comment
 *       properties:
 *         to_user_id_nurse:
 *           type: string
 *           description: ID của người nhận feedback (nurse_id)
 *           example: nurse_profile_uuid_abc
 *         matching_id:
 *           type: string
 *           description: ID của dịch vụ/chăm sóc liên quan (matching._id)
 *           example: matching_uuid_123
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Điểm đánh giá từ 1 đến 5
 *           example: 5
 *         title:
 *           type: string
 *           description: Tiêu đề ngắn (tùy chọn)
 *           example: Dịch vụ rất xuất sắc!
 *         comment:
 *           type: string
 *           description: Nội dung nhận xét
 *           example: Y tá rất tận tâm, chu đáo và thân thiện.
 *     Feedback:
 *       type: object
 *       required:
 *         - _id
 *         - from_user_id_elderly
 *         - to_user_id_nurse
 *         - matching_id
 *         - rating
 *         - comment
 *         - createdAt
 *         - is_verified
 *         - report_flag
 *         - service_level
 *       properties:
 *         _id:
 *           type: string
 *           description: ID feedback (MongoDB ObjectId)
 *           example: feedback_mongodb_objectid
 *         from_user_id_elderly:
 *           type: string
 *           description: ID của người gửi feedback (elderly_id)
 *           example: elderly_profile_uuid_xyz
 *         to_user_id_nurse:
 *           type: string
 *           description: ID của người nhận feedback (nurse_id)
 *           example: nurse_profile_uuid_abc
 *         matching_id:
 *           type: string
 *           description: ID của dịch vụ/chăm sóc liên quan (matching._id)
 *           example: matching_uuid_123
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Điểm đánh giá từ 1 đến 5
 *           example: 5
 *         title:
 *           type: string
 *           description: Tiêu đề ngắn (tùy chọn)
 *           example: Dịch vụ rất xuất sắc!
 *         comment:
 *           type: string
 *           description: Nội dung nhận xét
 *           example: Y tá rất tận tâm, chu đáo và thân thiện.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian gửi feedback
 *           example: 2025-06-17T15:00:00Z
 *         is_verified:
 *           type: boolean
 *           description: Feedback có được xác minh là hợp lệ không
 *           example: false
 *         report_flag:
 *           type: boolean
 *           description: Có bị báo cáo là giả mạo hoặc không trung thực không
 *           example: false
 *         report_reason:
 *           type: string
 *           description: Lý do nếu bị report
 *           example: null
 *         service_level:
 *           type: string
 *           enum: [basic, standard, premium]
 *           description: Mức dịch vụ liên quan đến feedback
 *           example: standard
 *         ai_sentiment_analysis:
 *           type: string
 *           enum: [positive, negative, neutral, pending]
 *           description: Kết quả phân tích cảm xúc từ model AI
 *           example: pending
 */

/**
 * @swagger
 * /feedbacks:
 *   post:
 *     summary: Gửi một phản hồi mới về dịch vụ (Elderly)
 *     tags: [Feedbacks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackInput'
 *     responses:
 *       201:
 *         description: Phản hồi đã được gửi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       403:
 *         description: Người dùng không có quyền (chỉ Elderly)
 *       404:
 *         description: Elderly profile, Nurse profile hoặc Service (matching) không tìm thấy
 */
router.post('/', auth, permit('elderly'), feedbackController.submitFeedback);

/**
 * @swagger
 * /feedbacks/user:
 *   get:
 *     summary: Lấy lịch sử phản hồi của người dùng hiện tại (Elderly hoặc Nurse)
 *     description: Elderly sẽ thấy các feedback họ đã gửi. Nurse sẽ thấy các feedback họ đã nhận.
 *     tags: [Feedbacks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng mục mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách phản hồi và thông tin phân trang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 feedbacks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feedback'
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 20
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Hồ sơ người dùng (Elderly/Nurse) không tìm thấy
 */
router.get('/user', auth, feedbackController.getUserFeedbacks);

// Hàm analyze-sentiment API đã được comment ra theo yêu cầu của bạn.
// router.post('/analyze-sentiment', auth, permit('admin'), feedbackController.processSentimentAnalysis);

module.exports = router;