const express = require('express');
const { createElderlyProfile,getElderlyByUserId,listElderly,updateElderlyProfile} = require('../controllers/elderlyController');
const {auth,permit} = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /elderly:
 *   post:
 *     summary: Tạo hồ sơ elderly (card sẽ tự động sinh sau khi tạo hồ sơ)
 *     tags: [Elderly]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - gender
 *               - date_of_birth
 *               - permanent_address
 *               - current_address
 *               - insurance_number
 *               - phone_number
 *               - avatar_url
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               gender:
 *                 type: boolean
 *                 example: true
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: 1950-01-01
 *               permanent_address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *                 example:
 *                   street: "123 Main St"
 *                   city: "Hà Nội"
 *                   country: "Việt Nam"
 *               current_address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *                 example:
 *                   street: "456 Second St"
 *                   city: "Hà Nội"
 *                   country: "Việt Nam"
 *               insurance_number:
 *                 type: string
 *                 example: "BHXH123456"
 *               phone_number:
 *                 type: string
 *                 example: "0987654321"
 *               avatar_url:
 *                 type: string
 *                 example: "https://example.com/avatar.jpg"
 *     responses:
 *       201:
 *         description: Hồ sơ elderly được tạo thành công, card sẽ tự động sinh
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       400:
 *         description: Hồ sơ đã tồn tại hoặc dữ liệu không hợp lệ
 *       403:
 *         description: Người dùng không có quyền tạo hồ sơ hoặc email chưa xác thực
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/', auth, permit('elderly'), createElderlyProfile);

/**
 * @swagger
 * /elderly/{user_id}:
 *   get:
 *     summary: Lấy hồ sơ elderly theo user_id
 *     tags: [Elderly]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID của user
 *     responses:
 *       200:
 *         description: Thông tin elderly
 *       404:
 *         description: Không tìm thấy elderly
 */
router.get('/:user_id', auth, permit('elderly', 'admin'), getElderlyByUserId);

/**
 * @swagger
 * /elderly:
 *   get:
 *     summary: Lấy danh sách elderly (admin)
 *     tags: [Elderly]
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
 *     responses:
 *       200:
 *         description: Danh sách elderly và phân trang
 */
router.get('/', auth, listElderly);

/**
 * @swagger
 * /elderly/profile:
 *   patch:
 *     summary: Cập nhật hồ sơ elderly của người dùng hiện tại
 *     tags: [Elderly]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Nguyễn Văn B
 *               gender:
 *                 type: boolean
 *                 example: false
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: 1955-03-20
 *               permanent_address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *                 example:
 *                   street: "123 Main St"
 *                   city: "Hà Nội"
 *                   country: "Việt Nam"
 *               current_address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *                 example:
 *                   street: "456 Second St"
 *                   city: "Hà Nội"
 *                   country: "Việt Nam"
 *               insurance_number:
 *                 type: string
 *                 example: BHXH654321
 *               phone_number:
 *                 type: string
 *                 example: 0123456789
 *               avatar_url:
 *                 type: string
 *                 example: https://example.com/new_avatar.jpg
 *               evm_address:
 *                 type: string
 *                 example: 0x5A263691E662D03c9C83E1454eCFf37EEF606194
 *     responses:
 *       200:
 *         description: Hồ sơ elderly đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Elderly'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Hồ sơ elderly không tìm thấy
 *       403:
 *         description: Người dùng không có quyền
 */
router.patch('/profile', auth, permit('elderly'), updateElderlyProfile);

module.exports = router;
