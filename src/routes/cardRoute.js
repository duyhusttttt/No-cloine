const express = require('express');
const { auth, permit } = require('../middleware/auth');
const { createCard,getCardByCardId,getCardByUserId,updateCard,deleteCard,listCards } = require('../controllers/cardController');
const router = express.Router();

/**
 * @swagger
 * /cards:
 *   post:
 *     summary: Tạo mới một card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               student_id:
 *                 type: string
 *                 description: ID sinh viên nếu role là nurse
 *                 example: STU123456
 *             example:
 *               student_id: STU123456
 *     responses:
 *       201:
 *         description: Card created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardData'
 *             example:
 *               card_id: card_001
 *               hashed_student_id: 5f2d3e4c6b7a8e9f0a1b2c3d4e5f6a7b
 *               user_id: null
 *               role: nurse
 *               status: active
 *               issued_by: Green Card Company
 *               issued_at: 2025-05-19T12:00:00Z
 *               expired_at: 2027-05-19T12:00:00Z
 *               last_used_at: null
 *               public_key: 0xabc...xyz
 *               private_key_encrypted: encrypted_private_key_123
 *               qr_code_data: data:image/png;base64,iVBORw0KG...==
 *               signature: 5f2d3e4c6b7a8e9f0a1b2c3d4e5f6a7bcard_001
 */
router.post('/', createCard);

/**
 * @swagger
 * /cards:
 *   get:
 *     summary: Lấy danh sách card (admin)
 *     tags: [Cards]
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
 *         description: Danh sách card và phân trang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cards:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CardData'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *             example:
 *               cards:
 *                 - card_id: card_001
 *                   role: nurse
 *                   status: active
 *                   issued_at: 2025-05-19T12:00:00Z
 *                   public_key: 0xabc...xyz
 *                   qr_code_data: data:image/png;base64,iVBORw0KG...==
 *                   signature: abc...
 *               total: 1
 *               page: 1
 *               limit: 20
 */
router.get('/',  listCards);//admin

/**
 * @swagger
 * /cards/{card_id}:
 *   get:
 *     summary: Lấy thông tin card theo card_id
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của card
 *         example: card_001
 *     responses:
 *       200:
 *         description: Thông tin card
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardData'
 *             example:
 *               card_id: card_001
 *               role: elderly
 *               status: active
 *               issued_at: 2025-05-19T12:00:00Z
 *               public_key: 0xabc...xyz
 *               qr_code_data: data:image/png;base64,iVBORw0KG...==
 *               signature: card_001
 *       404:
 *         description: Không tìm thấy card
 */
router.get('/:card_id', getCardByCardId);

/**
 * @swagger
 * /cards/user/{user_id}:
 *   get:
 *     summary: Lấy thông tin card theo user_id
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID của user
 *         example: 9b2fc678-1a23-4f67-8e90-12ab3456cd78
 *     responses:
 *       200:
 *         description: Thông tin card
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardData'
 *             example:
 *               card_id: card_001
 *               user_id: 9b2fc678-1a23-4f67-8e90-12ab3456cd78
 *               role: elderly
 *       404:
 *         description: Không tìm thấy card
 */
router.get('/user/:user_id', getCardByUserId);

/**
 * @swagger
 * /cards/{card_id}:
 *   put:
 *     summary: Cập nhật card theo card_id
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của card
 *         example: card_001
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, revoked, lost]
 *                 example: revoked
 *               last_used_at:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-05-20T09:00:00Z
 *     responses:
 *       200:
 *         description: Card đã được cập nhật
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardData'
 *             example:
 *               card_id: card_001
 *               status: revoked
 *               last_used_at: 2025-05-20T09:00:00Z
 *       404:
 *         description: Không tìm thấy card
 */
router.put('/:card_id', updateCard);

/**
 * @swagger
 * /cards/{card_id}:
 *   delete:
 *     summary: Xóa card theo card_id
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: card_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của card
 *         example: card_001
 *     responses:
 *       200:
 *         description: Card đã được xóa
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
 *                   example: Card deleted
 *       404:
 *         description: Không tìm thấy card
 */
router.delete('/:card_id', deleteCard);

module.exports = router;
