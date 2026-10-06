// src/routes/disputeRoute.js
const express = require('express');
const { auth, permit } = require('../middleware/auth');
const disputeController = require('../controllers/disputeController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Disputes
 *     description: Quản lý các yêu cầu tranh chấp
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DisputeInput:
 *       type: object
 *       required:
 *         - transaction_id
 *         - defendant_id
 *         - reason
 *       properties:
 *         transaction_id:
 *           type: string
 *           description: ID giao dịch bị tranh chấp
 *           example: uuid-transaction-123
 *         defendant_id:
 *           type: string
 *           description: ID người bị khiếu nại (nurse_profile_uuid hoặc elderly_profile_uuid)
 *           example: nurse_profile_uuid_abc
 *         reason:
 *           type: string
 *           description: Lý do tranh chấp
 *           example: Nurse không thực hiện đúng cam kết chăm sóc.
 *         evidences:
 *           type: array
 *           description: Danh sách bằng chứng (link hình ảnh, file bằng chứng)
 *           items:
 *             type: string
 *           example: ["https://example.com/evidence1.jpg", "https://example.com/chat_log.txt"]
 *     Dispute:
 *       type: object
 *       required:
 *         - _id
 *         - dispute_id
 *         - transaction_id
 *         - complainant_id
 *         - defendant_id
 *         - reason
 *         - status
 *         - created_at
 *       properties:
 *         _id:
 *           type: string
 *           description: ID duy nhất của tài liệu MongoDB
 *           example: 60d0fe4f5b67d5001c87a1b2
 *         dispute_id:
 *           type: string
 *           description: ID tranh chấp (UUID)
 *           example: d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6
 *         transaction_id:
 *           type: string
 *           description: ID giao dịch bị tranh chấp (tham chiếu đến TransactionModel)
 *           example: uuid-transaction-123
 *         complainant_id:
 *           type: string
 *           description: ID người gửi khiếu nại (elderly_id hoặc nurse_id)
 *           example: elderly_profile_uuid_xyz
 *         defendant_id:
 *           type: string
 *           description: ID người bị khiếu nại (elderly_id hoặc nurse_id)
 *           example: nurse_profile_uuid_abc
 *         reason:
 *           type: string
 *           description: Lý do tranh chấp
 *           example: Nurse không thực hiện đúng cam kết chăm sóc.
 *         evidences:
 *           type: array
 *           description: Danh sách bằng chứng (link hình ảnh, file bằng chứng)
 *           items:
 *             type: string
 *           example: ["https://example.com/evidence1.jpg", "https://example.com/chat_log.txt"]
 *         status:
 *           type: string
 *           enum: [open, under_review, resolved, rejected]
 *           description: Trạng thái tranh chấp
 *           example: open
 *         resolution:
 *           type: string
 *           description: Cách xử lý (phạt tiền, refund, ban...); Null nếu chưa giải quyết.
 *           example: null
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian tạo tranh chấp
 *           example: 2025-06-14T08:00:00Z
 *         resolved_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian giải quyết tranh chấp; Null nếu chưa giải quyết.
 *           example: null
 */

/**
 * @swagger
 * /disputes:
 *   post:
 *     summary: Tạo một yêu cầu tranh chấp mới (Elderly hoặc Nurse)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DisputeInput'
 *     responses:
 *       201:
 *         description: Yêu cầu tranh chấp đã được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Dispute'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       404:
 *         description: Giao dịch hoặc hồ sơ người dùng không tìm thấy
 *       409:
 *         description: Tranh chấp đã tồn tại cho giao dịch này
 *       403:
 *         description: Không có quyền (chỉ Elderly hoặc Nurse)
 */
router.post('/', auth, disputeController.createDispute);

/**
 * @swagger
 * /disputes/{id}:
 *   get:
 *     summary: Lấy thông tin tranh chấp theo ID
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tranh chấp (dispute_id)
 *     responses:
 *       200:
 *         description: Thông tin tranh chấp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Dispute'
 *       404:
 *         description: Tranh chấp không tìm thấy
 */
router.get('/:id', auth, disputeController.getDisputeById);

/**
 * @swagger
 * /disputes/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái tranh chấp (chỉ Admin)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tranh chấp (dispute_id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, under_review, resolved, rejected]
 *                 example: resolved
 *               resolution:
 *                 type: string
 *                 description: Mô tả giải pháp nếu trạng thái là resolved/rejected
 *                 example: Y tá đồng ý hoàn tiền 50% cho elderly.
 *     responses:
 *       200:
 *         description: Trạng thái tranh chấp đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Dispute'
 *       400:
 *         description: Trạng thái không hợp lệ hoặc yêu cầu không đủ điều kiện
 *       403:
 *         description: Không có quyền truy cập (chỉ Admin)
 *       404:
 *         description: Tranh chấp không tìm thấy
 */
router.patch('/:id/status', auth, disputeController.updateDisputeStatus);//admin

/**
 * @swagger
 * /disputes:
 *   get:
 *     summary: Lấy danh sách các tranh chấp (Admin, có thể lọc theo Complainant/Defendant ID)
 *     tags: [Disputes]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, under_review, resolved, rejected]
 *         description: Lọc theo trạng thái tranh chấp
 *       - in: query
 *         name: complainant_id
 *         schema:
 *           type: string
 *         description: Lọc theo ID người khiếu nại (elderly_profile_uuid hoặc nurse_profile_uuid)
 *       - in: query
 *         name: defendant_id
 *         schema:
 *           type: string
 *         description: Lọc theo ID người bị khiếu nại (elderly_profile_uuid hoặc nurse_profile_uuid)
 *     responses:
 *       200:
 *         description: Danh sách tranh chấp và thông tin phân trang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 disputes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dispute'
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 20
 *       403:
 *         description: Không có quyền truy cập (Nurse/Elderly chỉ có thể xem tranh chấp liên quan đến họ)
 */
router.get('/', auth, disputeController.listDisputes);

module.exports = router;