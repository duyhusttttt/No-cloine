const express = require('express');
const { getNurseByUserId, createNurseProfile,updateNurseProfile,getAvailableNurses,getAllNusersIsAvailableForMatching} = require('../controllers/nurseController');
const {auth,permit} = require('../middleware/auth');
const router = express.Router();

console.log('==> nurseRoute loaded');

/**
 * @swagger
 * /nurses/{user_id}:
 *   get:
 *     summary: Lấy thông tin y tá
 *     tags: [Nurses]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: User_ID của y tá
 *     responses:
 *       200:
 *         description: Thông tin y tá
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
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       description: ID của người dùng liên kết
 *                       example: 64b7f3c2e4b0d6a1f8e4b0d6
 *                     card_id:
 *                       type: string
 *                       description: ID thẻ QR của y tá
 *                       example: 64b7f3c2e4b0d6a1f8e4b0d6
 *                     student_id:
 *                       type: string
 *                       description: ID sinh viên của y tá
 *                       example: 64b7f3c2e4b0d6a1f8e4b0d6
 *                     level:
 *                       type: string
 *                       description: Cấp độ của y tá
 *                       example: standard
 *       404:
 *         description: Y tá không tồn tại
 *       500:
 *         description: Lỗi máy chủ
 */

router.get('/:id', auth, permit('nurse'), getNurseByUserId);
/**
 * @swagger
 * /nurses/profile:
 *   post:
 *     summary: Tạo hồ sơ y tá (card sẽ tự động sinh sau khi tạo hồ sơ)
 *     tags: [Nurses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - level
 *               - experience_years
 *               - specializations
 *               - certifications
 *               - location
 *               - school
 *               - year_of_study
 *               - poseidonHash
 *               - test_score
 *               - class
 *               - course
 *               - major
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [basic, standard, premium]
 *                 description: Cấp độ của y tá
 *                 example: standard
 *               experience_years:
 *                 type: number
 *                 description: Số năm kinh nghiệm
 *                 example: 3
 *               specializations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách chuyên môn của y tá
 *                 example: ["Pediatrics", "Geriatrics"]
 *               certifications:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách chứng chỉ của y tá
 *                 example: ["BLS", "ACLS"]
 *               location:
 *                 type: string
 *                 description: Địa chỉ của y tá
 *                 example: "123 Main Street, City, Country"
 *               school:
 *                 type: string
 *                 description: Trường học của y tá
 *                 example: "Medical University"
 *               year_of_study:
 *                 type: number
 *                 description: Năm học của y tá
 *                 example: 3
 *               poseidonHash:
 *                 type: string
 *                 description: Hash Poseidon của y tá
 *                 example: "abc123hash"
 *               test_score:
 *                 type: number
 *                 description: Điểm kiểm tra của y tá
 *                 example: 8
 *               class:
 *                 type: string
 *                 description: Lớp học của y tá
 *                 example: "Class A"
 *               course:
 *                 type: string
 *                 description: Khóa học của y tá
 *                 example: "Nursing"
 *               major:
 *                 type: string
 *                 description: Chuyên ngành của y tá
 *                 example: "Pediatrics"
 *     responses:
 *       201:
 *         description: Hồ sơ y tá được tạo thành công, card sẽ tự động sinh
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
router.post('/profile',  auth, permit('nurse'), createNurseProfile);

/**
 * @swagger
 * /nurses/profile:
 *   patch:
 *     summary: Cập nhật hồ sơ nurse của người dùng hiện tại
 *     tags: [Nurses]
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
 *                 example: Nguyễn Thị A
 *               gender:
 *                 type: boolean
 *                 example: true
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-01
 *               phone_number:
 *                 type: string
 *                 example: 0987654321
 *               avatar_url:
 *                 type: string
 *                 example: https://example.com/avatar.jpg
 *               evm_address:
 *                 type: string
 *                 example: 0x5A263691E662D03c9C83E1454eCFf37EEF606194
 *     responses:
 *       200:
 *         description: Hồ sơ nurse đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Nurse'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Hồ sơ nurse không tìm thấy
 *       403:
 *         description: Người dùng không có quyền
 */
router.patch('/profile', auth, permit('nurse'), updateNurseProfile);



/**
 * @swagger
 * /nurses/matching/available:
 *   get:
 *     summary: Lấy danh sách tất cả người dùng (admin)
 *     tags: [Nurses]
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
 *         description: Danh sách users và phân trang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get('/matching/available',auth, getAllNusersIsAvailableForMatching);


module.exports = router;