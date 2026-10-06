
const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  handleLogin,
  createUser,
  updateLogout,
  getAccount,
  updateUser,
  deleteUser,
  sendVerifyEmail,
  verifyAccount,
  QRLogin
} = require('../controllers/userController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateUserInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - role
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: Password123!
 *         role:
 *           type: string
 *           enum: [nurse, elderly]
 *           example: nurse
 *         student_id:
 *           type: string
 *           description: Bắt buộc nếu role = nurse
 *           example: STU123456
 *     CreateUserResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: User created. Please verify email.
 *         user:
 *           type: object
 *           properties:
 *             user_id:
 *               type: string
 *               example: f47ac10b-58cc-4372-a567-0e02b2c3d479
 *             email:
 *               type: string
 *               example: user@example.com
 *             role:
 *               type: string
 *               example: nurse
 *     LoginInput:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: Password123!
 *     LoginResponse:
 *       type: object
 *       properties:
 *         access_token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           type: object
 *           properties:
 *             user_id:
 *               type: string
 *               example: f47ac10b-58cc-4372-a567-0e02b2c3d479
 *             email:
 *               type: string
 *               example: user@example.com
 *             role:
 *               type: string
 *               example: nurse
 *     MessageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Action completed successfully.
 */


/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User management and authentication
 */

// Public routes

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Tạo mới một người dùng
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       201:
 *         description: Người dùng đã được tạo, cần xác thực email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateUserResponse'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       409:
 *         description: Email hoặc Student ID đã tồn tại
 */
router.post('/register', createUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Đăng nhập người dùng
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Thiếu email hoặc password
 *       401:
 *         description: Email hoặc mật khẩu không chính xác, hoặc email chưa xác thực
 */
router.post('/login', handleLogin);

/**
 * @swagger
 * /users/send-verify-email:
 *   post:
 *     summary: Gửi mã OTP xác thực email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP đã được gửi
 *       400:
 *         description: Thiếu hoặc sai định dạng email
 */
router.post('/send-verify-email', sendVerifyEmail);

/**
 * @swagger
 * /users/verify-account:
 *   post:
 *     summary: Xác thực tài khoản bằng mã OTP
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xác thực thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *       400:
 *         description: OTP không hợp lệ hoặc đã hết hạn
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.post('/verify-account', verifyAccount);


/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Đăng xuất người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       401:
 *         description: Unauthorized hoặc token hết hạn
 */
router.post('/logout',auth, updateLogout);

/**
 * @swagger
 * /users/account:
 *   get:
 *     summary: Lấy thông tin tài khoản hiện tại
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/account',auth, getAccount);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy danh sách tất cả người dùng (admin)
 *     tags: [Users]
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
router.get('/',auth, getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Lấy user theo user_id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: UUID của user
 *     responses:
 *       200:
 *         description: Thông tin user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/:id', auth,getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Cập nhật user theo user_id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: UUID của user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.put('/:id', auth,updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Xóa user theo user_id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: UUID của user
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/:id',auth, deleteUser);

/**
 * @swagger
 * /users/qr-login:
 *   post:
 *     summary: Đăng nhập bằng QR Code (upload file ảnh QR)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               qrImage:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh QR code (PNG/JPG)
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *       400:
 *         description: Không đọc được QR code hoặc QR code không hợp lệ
 *       404:
 *         description: Card hoặc user không tồn tại
 */
const multer = require('multer');
const upload = multer();
router.post('/qr-login', upload.single('qrImage'), QRLogin);


module.exports = router;
