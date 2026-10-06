const express = require('express');
const { auth, permit } = require('../middleware/auth');
const {
  createFromContract,
  processPayment,
  refund,
  getUserTransactions,
  listTransactions,
  getTransactionById,
  updateTransactionStatus
} = require('../controllers/transactionController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         transaction_id:
 *           type: string
 *         contract_id:
 *           type: string
 *         elderly_id:
 *           type: string
 *         nurse_id:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *           enum: [VND, PlatformToken]
 *         service_type:
 *           type: string
 *           enum: [basic, standard, premium]
 *         platform_fee:
 *           type: number
 *         nurse_receive_amount:
 *           type: number
 *         payment_method:
 *           type: string
 *           enum: [bank_transfer, smart_contract_transfer]
 *         status:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *         note:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /transactions/from-contract/{contractId}:
 *   post:
 *     summary: Tạo giao dịch từ hợp đồng
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hợp đồng
 *     responses:
 *       201:
 *         description: Giao dịch đã được tạo từ hợp đồng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Dữ liệu hợp đồng không hợp lệ
 *       404:
 *         description: Không tìm thấy hợp đồng
 */

/**
 * @swagger
 * /transactions/process/{transactionId}:
 *   post:
 *     summary: Xử lý thanh toán giao dịch (elderly)
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID giao dịch
 *     responses:
 *       200:
 *         description: Thanh toán thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Giao dịch không hợp lệ
 *       403:
 *         description: Không có quyền thanh toán
 *       404:
 *         description: Không tìm thấy giao dịch
 */

/**
 * @swagger
 * /transactions/refund/{transactionId}:
 *   post:
 *     summary: Hoàn tiền giao dịch (admin)
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID giao dịch
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Lý do hoàn tiền
 *     responses:
 *       200:
 *         description: Hoàn tiền thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Giao dịch không hợp lệ
 *       404:
 *         description: Không tìm thấy giao dịch
 */

/**
 * @swagger
 * /transactions/user:
 *   get:
 *     summary: Lấy danh sách giao dịch của user hiện tại (nurse hoặc elderly)
 *     tags: [Transaction]
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
 *         description: Danh sách giao dịch của user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Lấy danh sách giao dịch (lọc theo role, phân trang)
 *     tags: [Transaction]
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
 *           enum: [pending, completed, failed, cancelled]
 *       - in: query
 *         name: elderly_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: nurse_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách giao dịch và phân trang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */

/**
 * @swagger
 * /transactions/{transactionId}/status:
 *   patch:
 *     summary: Cập nhật trạng thái giao dịch (admin)
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: transaction_id của giao dịch
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
 *                 enum: [pending, completed, failed, cancelled]
 *     responses:
 *       200:
 *         description: Đã cập nhật trạng thái giao dịch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Trạng thái không hợp lệ
 *       404:
 *         description: Không tìm thấy giao dịch
 */
// Tạo transaction từ hợp đồng
router.post('/from-contract/:contractId', auth, createFromContract);

// Xử lý thanh toán (elderly)
router.post('/process/:transactionId', auth, processPayment);

// Hoàn tiền (admin)
router.post('/refund/:transactionId', auth, refund); //admin

// Lấy danh sách giao dịch của user hiện tại
router.get('/user', auth, getUserTransactions);

// Lấy danh sách giao dịch (lọc, phân trang)
router.get('/', auth, listTransactions);

// Lấy chi tiết giao dịch theo id
router.get('/:id', auth, getTransactionById);

// Cập nhật trạng thái giao dịch (admin)
router.patch('/:transactionId/status', auth, permit('admin'), updateTransactionStatus);

module.exports = router;