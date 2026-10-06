// src/routes/withdrawRequestRoute.js
const express = require('express');
const { auth, permit } = require('../middleware/auth');
const withdrawRequestController = require('../controllers/withdrawRequestController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Withdraw Requests
 *     description: Quản lý các yêu cầu rút tiền của Nurse
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WithdrawRequestInput:
 *       type: object
 *       required:
 *         - amount
 *         - bank_account_info
 *       properties:
 *         amount:
 *           type: number
 *           description: "Số tiền muốn rút (VND)"
 *           example: 2000000
 *         bank_account_info:
 *           type: object
 *           required:
 *             - account_number
 *             - bank_name
 *             - account_holder
 *           properties:
 *             account_number:
 *               type: string
 *               description: "Số tài khoản ngân hàng"
 *               example: "0123456789"
 *             bank_name:
 *               type: string
 *               description: "Tên ngân hàng"
 *               example: "Vietcombank"
 *             account_holder:
 *               type: string
 *               description: "Chủ tài khoản"
 *               example: "Nguyen Van A"
 *         crypto_address:
 *           type: string
 *           description: "Địa chỉ ví crypto (nếu rút bằng token)"
 *           example: "0x1234567890abcdef1234567890abcdef12345678"
 *           nullable: true
 *
 *     WithdrawRequest:
 *       type: object
 *       required:
 *         - _id
 *         - nurse_id
 *         - amount
 *         - status
 *         - created_at
 *       properties:
 *         _id:
 *           type: string
 *           description: "ID yêu cầu rút tiền"
 *           example: "wr_001"
 *         nurse_id:
 *           type: string
 *           description: "ID của nurse yêu cầu rút tiền"
 *           example: "nurse_001"
 *         amount:
 *           type: number
 *           description: "Số tiền muốn rút (VND)"
 *           example: 2000000
 *         status:
 *           type: string
 *           enum: [pending, processed, rejected]
 *           description: "Trạng thái yêu cầu rút tiền"
 *           example: "pending"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2024-06-17T10:00:00.000Z"
 *         processed_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         note:
 *           type: string
 *           nullable: true
 *           description: "Ghi chú xử lý (nếu có)"
 *           example: "Yêu cầu đã được xử lý thành công"
 *         bank_account_info:
 *           type: object
 *           properties:
 *             account_number:
 *               type: string
 *               example: "0123456789"
 *             bank_name:
 *               type: string
 *               example: "Vietcombank"
 *             account_holder:
 *               type: string
 *               example: "Nguyen Van A"
 *           description: "Thông tin tài khoản ngân hàng"
 *         crypto_address:
 *           type: string
 *           description: "Địa chỉ ví crypto (nếu rút bằng token)"
 *           example: "0x1234567890abcdef1234567890abcdef12345678"
 *           nullable: true
 */

/**
 * @swagger
 * /withdraw-requests:
 *   post:
 *     summary: Tạo một yêu cầu rút tiền mới (Nurse)
 *     tags: [Withdraw Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WithdrawRequestInput'
 *           example:
 *             amount: 2000000
 *             bank_account_info:
 *               account_number: "0123456789"
 *               bank_name: "Vietcombank"
 *               account_holder: "Nguyen Van A"
 *             crypto_address: "0x1234567890abcdef1234567890abcdef12345678"
 *     responses:
 *       201:
 *         description: Yêu cầu rút tiền đã được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WithdrawRequest'
 *             example:
 *               success: true
 *               data:
 *                 _id: "wr_001"
 *                 nurse_id: "nurse_001"
 *                 amount: 2000000
 *                 status: "pending"
 *                 created_at: "2024-06-17T10:00:00.000Z"
 *                 processed_at: null
 *                 note: null
 *                 bank_account_info:
 *                   account_number: "0123456789"
 *                   bank_name: "Vietcombank"
 *                   account_holder: "Nguyen Van A"
 *                 crypto_address: "0x1234567890abcdef1234567890abcdef12345678"
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ hoặc số dư không đủ
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Số dư không đủ"
 *
 *   get:
 *     summary: Lấy danh sách yêu cầu rút tiền (nurse hoặc admin)
 *     tags: [Withdraw Requests]
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
 *           enum: [pending, processed, rejected]
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu rút tiền và phân trang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 requests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WithdrawRequest'
 *                 total:
 *                   type: integer
 *                   example: 2
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 20
 *             example:
 *               success: true
 *               requests:
 *                 - _id: "wr_001"
 *                   nurse_id: "nurse_001"
 *                   amount: 2000000
 *                   status: "pending"
 *                   created_at: "2024-06-17T10:00:00.000Z"
 *                   processed_at: null
 *                   note: null
 *                   bank_account_info:
 *                     account_number: "0123456789"
 *                     bank_name: "Vietcombank"
 *                     account_holder: "Nguyen Van A"
 *                   crypto_address: "0x1234567890abcdef1234567890abcdef12345678"
 *                 - _id: "wr_002"
 *                   nurse_id: "nurse_002"
 *                   amount: 1500000
 *                   status: "processed"
 *                   created_at: "2024-06-16T09:00:00.000Z"
 *                   processed_at: "2024-06-16T12:00:00.000Z"
 *                   note: "Đã chuyển khoản thành công"
 *                   bank_account_info:
 *                     account_number: "9876543210"
 *                     bank_name: "ACB"
 *                     account_holder: "Tran Thi B"
 *                   crypto_address: null
 *               total: 2
 *               page: 1
 *               limit: 20
 *       403:
 *         description: Không có quyền truy cập (Nurse chỉ có thể xem yêu cầu của mình)
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Forbidden: Nurse can only view their own withdrawal requests."
 */
router.post('/', auth, permit('nurse'), withdrawRequestController.createWithdrawRequest);

/**
 * @swagger
 * /withdraw-requests/{id}/process:
 *   patch:
 *     summary: Xử lý yêu cầu rút tiền (admin)
 *     tags: [Withdraw Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID yêu cầu rút tiền"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [completed, rejected]
 *                 example: "completed"
 *               note:
 *                 type: string
 *                 description: "Ghi chú xử lý (nếu có)"
 *                 example: "Đã chuyển khoản thành công"
 *     responses:
 *       200:
 *         description: Yêu cầu rút tiền đã được xử lý
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WithdrawRequest'
 *             example:
 *               success: true
 *               data:
 *                 _id: "wr_001"
 *                 nurse_id: "nurse_001"
 *                 amount: 2000000
 *                 status: "processed"
 *                 created_at: "2024-06-17T10:00:00.000Z"
 *                 processed_at: "2024-06-17T12:00:00.000Z"
 *                 note: "Đã chuyển khoản thành công"
 *                 bank_account_info:
 *                   account_number: "0123456789"
 *                   bank_name: "Vietcombank"
 *                   account_holder: "Nguyen Van A"
 *                 crypto_address: "0x1234567890abcdef1234567890abcdef12345678"
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Trạng thái không hợp lệ"
 *       404:
 *         description: Không tìm thấy yêu cầu rút tiền
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Không tìm thấy yêu cầu rút tiền"
 */
router.patch('/:id/process', auth, withdrawRequestController.processWithdrawRequest);//admin


router.get('/', auth, withdrawRequestController.listWithdrawRequests);

module.exports = router;