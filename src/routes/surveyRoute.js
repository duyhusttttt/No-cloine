const express = require('express');

const  {
  submitSurvey,
  verifySurvey,
  getSurveyHistory,
} = require('../controllers/surveyController');
const {auth,permit} = require('../middleware/auth');

const router = express.Router();

// Elderly routes
/**
 * @swagger
 * /survey/submit:
 *   post:
 *     summary: Nộp khảo sát (Elderly submit survey)
 *     tags: [Survey]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questions]
 *             properties:
 *               questions:
 *                 type: array
 *                 description: Danh sách câu hỏi và câu trả lời
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                       example: "Bạn cảm thấy sức khỏe thế nào?"
 *                     answer:
 *                       type: string
 *                       example: "Tốt"
 *     responses:
 *       201:
 *         description: Đã lưu khảo sát thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 attempt_id:
 *                   type: string
 *                 elderly_id:
 *                   type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       question:
 *                         type: string
 *                       answer:
 *                         type: string
 *                 verified:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post("/submit", auth, permit('elderly'), submitSurvey);

/**
 * @swagger
 * /survey/history:
 *   get:
 *     summary: Lấy lịch sử khảo sát của elderly
 *     tags: [Survey]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách khảo sát của elderly
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   attempt_id:
 *                     type: string
 *                   elderly_id:
 *                     type: string
 *                   questions:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         question:
 *                           type: string
 *                         answer:
 *                           type: string
 *                   verified:
 *                     type: boolean
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 */
router.get("/history", auth, permit('elderly'), getSurveyHistory);

// Admin routes
/**
 * @swagger
 * /survey/verify/{attemptId}:
 *   patch:
 *     summary: Xác minh khảo sát (admin)
 *     tags: [Survey]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của lần khảo sát
 *     responses:
 *       200:
 *         description: Khảo sát đã được xác minh
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 attempt_id:
 *                   type: string
 *                 elderly_id:
 *                   type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       question:
 *                         type: string
 *                       answer:
 *                         type: string
 *                 verified:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Khảo sát không tồn tại hoặc đã xác minh
 */
router.patch("/verify/:attemptId", auth, verifySurvey);//admin

module.exports = router;