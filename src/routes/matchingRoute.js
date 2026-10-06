const express = require('express');
const { auth, permit } = require('../middleware/auth');
const {
  createMatching,
  listMatching,
  getMatchingById,
  updateBookingTime,
  signContract,
  reportViolation,
  completeMatch,
  resetMatch,
  deleteMatching,
  requestSignOtp,
  confirmSign,
} = require('../controllers/matchingController');

const router = express.Router();

/**
 * @swagger
 * /matching:
 *   post:
 *     summary: Elderly booking nurse (tạo matching)
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nurse_id, service_level, booking_time]
 *             properties:
 *               nurse_id:
 *                 type: string
 *                 description: ID của y tá được booking
 *               service_level:
 *                 type: string
 *                 enum: [basic, standard, premium]
 *                 description: Gói dịch vụ
 *               booking_time:
 *                 type: array
 *                 description: Danh sách các khung giờ booking
 *                 items:
 *                   type: object
 *                   properties:
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                     end_time:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       201:
 *         description: Matching created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Matching'
 */
router.post('/', permit('elderly'), createMatching);

/**
 * @swagger
 * /matching:
 *   get:
 *     summary: Danh sách matching (admin)
 *     tags: [Matching]
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
 *         name: isMatched
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: service_level
 *         schema:
 *           type: string
 *           enum: [basic, standard, premium]
 *     responses:
 *       200:
 *         description: Danh sách matching và phân trang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matchings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Matching'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get('/', listMatching);

/**
 * @swagger
 * /matching/{id}:
 *   get:
 *     summary: Lấy matching theo id
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của matching
 *     responses:
 *       200:
 *         description: Thông tin matching
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Matching'
 *       404:
 *         description: Không tìm thấy matching
 */
router.get('/:id', getMatchingById);

/**
 * @swagger
 * /matching/{id}/booking:
 *   patch:
 *     summary: Cập nhật booking_time của matching
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của matching
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               booking_time:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     start_time:
 *                       type: string
 *                       format: date-time
 *                     end_time:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       200:
 *         description: Booking time updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Matching'
 *       404:
 *         description: Không tìm thấy matching
 */
router.patch('/:id/booking', permit('elderly'), updateBookingTime);

/**
 * @swagger
 * /matching/{id}/sign:
 *   post:
 *     summary: Ký hợp đồng số cho matching
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của matching
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 description: Chữ ký số
 *               by:
 *                 type: string
 *                 enum: [elderly, nurse]
 *                 description: Ai ký
 *     responses:
 *       200:
 *         description: Đã ký hợp đồng số
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Matching'
 */
router.post('/:id/sign', signContract);

/**
 * @swagger
 * /matching/{id}/violation:
 *   post:
 *     summary: Báo cáo vi phạm hợp đồng
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của matching
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reported_by:
 *                 type: string
 *                 enum: [elderly, nurse]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đã báo cáo vi phạm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Matching'
 */
router.post('/:id/violation', reportViolation);

/**
 * @swagger
 * /matching/{id}/complete:
 *   post:
 *     summary: Đánh dấu matching hoàn thành (admin)
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của matching
 *     responses:
 *       200:
 *         description: Đã hoàn thành matching
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Matching'
 */
router.post('/:id/complete', completeMatch);

/**
 * @swagger
 * /matching/{id}/reset:
 *   post:
 *     summary: Reset trạng thái matching (admin)
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của matching
 *     responses:
 *       200:
 *         description: Đã reset matching
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Matching'
 */
router.post('/:id/reset', resetMatch);

/**
 * @swagger
 * /matching/{id}:
 *   delete:
 *     summary: Xóa matching (admin)
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của matching
 *     responses:
 *       200:
 *         description: Đã xóa matching
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Matching deleted
 */
router.delete('/:id', deleteMatching);

// Yêu cầu OTP để ký
router.post('/:id/sign/request', requestSignOtp);

/**
 * @swagger
 * /matching/{id}/sign/confirm:
 *   post:
 *     summary: Xác nhận ký hợp đồng số bằng OTP
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của matching
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp]
 *             properties:
 *               otp:
 *                 type: string
 *                 description: Mã OTP xác nhận ký
 *     responses:
 *       200:
 *         description: Xác nhận ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Matching'
 *       400:
 *         description: OTP không hợp lệ hoặc thiếu thông tin
 *       404:
 *         description: Không tìm thấy matching
 */
router.post('/:id/sign/confirm', confirmSign);

module.exports = router;