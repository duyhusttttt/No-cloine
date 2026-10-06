const express = require('express');
const router = express.Router();
const {submitTest,getTestHistory} = require('../controllers/testController');
const { addTestQuestions } = require('../controllers/testController');
const {auth,permit} = require('../middleware/auth');


/**
 * @swagger
 * /test/submit:
 *   post:
 *     summary: Nộp bài kiểm tra (submit test attempt)
 *     tags: [Test]
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
 *                 description: Danh sách câu hỏi và đáp án người dùng chọn
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                       example: "What is 2 + 2?"
 *                     difficulty:
 *                       type: string
 *                       enum: [easy, medium, hard]
 *                       example: easy
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["1", "2", "3", "4"]
 *                     correct_answer:
 *                       type: string
 *                       example: "4"
 *                     user_answer:
 *                       type: string
 *                       example: "4"
 *     responses:
 *       201:
 *         description: Bài kiểm tra đã được nộp thành công, không có nội dung phản hồi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: {}
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 */
router.post('/submit', auth, permit('nurse'), submitTest);

/**
 * @swagger
 * /test/history:
 *   get:
 *     summary: Lấy lịch sử kết quả test của user hiện tại (admin)
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách kết quả test của user
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
 *                   user_id:
 *                     type: string
 *                   total_questions:
 *                     type: integer
 *                   correct_answers:
 *                     type: integer
 *                   score:
 *                     type: number
 *                   current_score:
 *                     type: number
 *                   average_score:
 *                     type: number
 *                   question_details:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         question:
 *                           type: string
 *                         options:
 *                           type: array
 *                           items:
 *                             type: string
 *                         correct_answer:
 *                           type: string
 *                         user_answer:
 *                           type: string
 *                         is_correct:
 *                           type: boolean
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 */
router.get('/history', auth, getTestHistory); //admin

/**
 * @swagger
 * components:
 *   schemas:
 *     TestQuestion:
 *       type: object
 *       required:
 *         - question
 *         - difficulty
 *         - options
 *         - correct_answer
 *       properties:
 *         question:
 *           type: string
 *           description: Nội dung câu hỏi
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           description: Độ khó
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 4
 *           maxItems: 4
 *           description: Danh sách 4 đáp án
 *         correct_answer:
 *           type: string
 *           description: Đáp án đúng
 */

/**
 * @swagger
 * /test/questions:
 *   post:
 *     summary: Đăng câu hỏi kiểm tra (admin)
 *     tags: [Test]
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
 *                 items:
 *                   $ref: '#/components/schemas/TestQuestion'
 *     responses:
 *       201:
 *         description: Đã thêm câu hỏi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TestQuestion'
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/questions', auth, addTestQuestions);//admin
module.exports = router;