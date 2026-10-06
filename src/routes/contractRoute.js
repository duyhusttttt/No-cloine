const express = require('express');
const { auth, permit } = require('../middleware/auth');
const {
  listContracts,
  getContractById,
  updateContractStatus,
  deleteContract,
  fillContract
} = require('../controllers/contractController');

const router = express.Router();

/**
 * @swagger
 * tags:
 * - name: Contracts
 * description: Contract management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Contract:
 *       type: object
 *       required:
 *         - matching_id
 *         - elderly_id
 *         - nurse_id
 *         - status
 *         - effective_date
 *         - created_by
 *         - last_modified_at
 *         - payment_details
 *         - terms
 *       properties:
 *         _id:
 *           type: string
 *           description: ID duy nhất của tài liệu MongoDB
 *           example: 60d0fe4f5b67d5001c87a1b2
 *         matching_id:
 *           type: string
 *           description: ID của matching
 *           example: match_uuid_123
 *         elderly_id:
 *           type: string
 *           description: ID của elderly
 *           example: elderly_uuid_abc
 *         nurse_id:
 *           type: string
 *           description: ID của nurse
 *           example: nurse_uuid_xyz
 *         contract_hash:
 *           type: string
 *           description: Hash của hợp đồng thông minh trên blockchain (nếu đã ký)
 *           example: 0xabcdef1234567890abcdef1234567890abcdef12
 *         signed_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian hợp đồng được ký bởi cả hai bên
 *           example: 2025-06-15T10:00:00Z
 *         status:
 *           type: string
 *           enum: [pending, active, violated, terminated]
 *           example: pending
 *         signed_by_elderly:
 *           type: string
 *           format: date-time
 *           description: Thời điểm elderly ký hợp đồng
 *           example: 2025-06-15T09:30:00Z
 *         signed_by_nurse:
 *           type: string
 *           format: date-time
 *           description: Thời điểm nurse ký hợp đồng
 *           example: 2025-06-15T09:45:00Z
 *         elderly_signature:
 *           type: boolean
 *           description: True nếu elderly đã ký
 *           example: true
 *         nurse_signature:
 *           type: boolean
 *           description: True nếu nurse đã ký
 *           example: true
 *         effective_date:
 *           type: string
 *           format: date-time
 *           example: 2025-06-16T00:00:00Z
 *         expiry_date:
 *           type: string
 *           format: date-time
 *           description: Ngày hết hạn hợp đồng
 *           example: 2026-06-16T00:00:00Z
 *         created_by:
 *           type: string
 *           example: system
 *         last_modified_at:
 *           type: string
 *           format: date-time
 *           example: 2025-06-15T09:50:00Z
 *         history_logs:
 *           type: array
 *           description: Lịch sử thay đổi trạng thái hợp đồng
 *           items:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *               modified_by:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *         payment_details:
 *           type: object
 *           properties:
 *             transaction_id:
 *               type: string
 *               description: ID giao dịch liên quan
 *             service_level:
 *               type: string
 *               enum: [basic, standard, premium]
 *               example: standard
 *             price_per_hour:
 *               type: number
 *               example: 200000
 *             total_hours_booked:
 *               type: number
 *               example: 10
 *             deposit_amount:
 *               type: number
 *               example: 1000000
 *             remaining_payment:
 *               type: number
 *               example: 1000000
 *             nurse_share_percentage:
 *               type: number
 *               example: 75
 *             platform_share_percentage:
 *               type: number
 *               example: 25
 *             nurse_total_earnings:
 *               type: number
 *               example: 1500000
 *             platform_total_earnings:
 *               type: number
 *               example: 500000
 *             currency:
 *               type: string
 *               enum: [VND, PlatformToken]
 *               example: VND
 *         terms:
 *           type: array
 *           description: Danh sách điều khoản hợp đồng
 *           items:
 *             type: string
 *           example: ["Elderly phải thanh toán trước 50% giá trị hợp đồng."]
 *     FillContractInput:
 *       type: object
 *       required:
 *         - payment_details
 *         - effective_date
 *         - expiry_date
 *       properties:
 *         terms:
 *           type: array
 *           description: Danh sách điều khoản hợp đồng
 *           items:
 *             type: string
 *           example: ["Elderly phải thanh toán trước 50% giá trị hợp đồng."]
 *         payment_details:
 *           type: object
 *           properties:
 *             service_level:
 *               type: string
 *               enum: [basic, standard, premium]
 *               example: standard
 *             price_per_hour:
 *               type: number
 *               example: 200000
 *             total_hours_booked:
 *               type: number
 *               example: 10
 *             deposit_amount:
 *               type: number
 *               example: 1000000
 *             remaining_payment:
 *               type: number
 *               example: 1000000
 *             nurse_share_percentage:
 *               type: number
 *               example: 75
 *             platform_share_percentage:
 *               type: number
 *               example: 25
 *             nurse_total_earnings:
 *               type: number
 *               example: 1500000
 *             platform_total_earnings:
 *               type: number
 *               example: 500000
 *             currency:
 *               type: string
 *               enum: [VND, PlatformToken]
 *               example: PlatformToken
 *         effective_date:
 *           type: string
 *           format: date
 *           example: "2025-06-01"
 *         expiry_date:
 *           type: string
 *           format: date
 *           example: "2025-12-01"
 */

/**
 * @swagger
 * /contract:
 *   get:
 *     summary: Lấy danh sách hợp đồng (admin)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, violated, terminated]
 *     responses:
 *       200:
 *         description: Danh sách hợp đồng và phân trang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contracts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contract'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get('/', listContracts);//admin

/**
 * @swagger
 * /contract/{id}:
 *   get:
 *     summary: Lấy thông tin hợp đồng theo id
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của hợp đồng
 *     responses:
 *       200:
 *         description: Thông tin hợp đồng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 *       404:
 *         description: Không tìm thấy hợp đồng
 */
router.get('/:id', getContractById);

/**
 * @swagger
 * /contract/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái hợp đồng (admin)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của hợp đồng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, active, violated, terminated]
 *                 example: active
 *     responses:
 *       200:
 *         description: Trạng thái hợp đồng đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 *       404:
 *         description: Không tìm thấy hợp đồng
 */
router.patch('/:id/status', permit('admin'), updateContractStatus);

/**
 * @swagger
 * /contract/{id}:
 *   delete:
 *     summary: Xóa hợp đồng (admin)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của hợp đồng
 *     responses:
 *       200:
 *         description: Đã xóa hợp đồng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Contract deleted
 *       404:
 *         description: Không tìm thấy hợp đồng
 */
router.delete('/:id', permit('admin'), deleteContract);

/**
 * @swagger
 * /contract/{id}/fill:
 *   put:
 *     summary: Điền chi tiết hợp đồng (nurse hoặc admin)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của hợp đồng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FillContractInput'
 *     responses:
 *       200:
 *         description: Hợp đồng đã được điền chi tiết và gửi OTP ký cho elderly/nurse
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 *       400:
 *         description: Chỉ hợp đồng pending mới có thể fill detail
 *       404:
 *         description: Không tìm thấy hợp đồng
 */
router.put('/:id/fill', permit('nurse','admin'), fillContract);
module.exports = router;