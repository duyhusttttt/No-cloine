const express = require("express");
const router = express.Router();
const {createLog,getLogs,updateLog} = require("../controllers/serviceLogController");
const {auth,permit} = require("../middleware/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     ServiceLog:
 *       type: object
 *       required:
 *         - _id
 *         - nurse_id
 *         - elderly_id
 *         - start_time
 *         - end_time
 *         - location
 *         - tasks_performed
 *         - vital_signs
 *         - created_at
 *         - updated_at
 *       properties:
 *         _id:
 *           type: string
 *         nurse_id:
 *           type: string
 *           description: ID của y tá chăm sóc (tham chiếu đến nurses)
 *         elderly_id:
 *           type: string
 *           description: ID của người cao tuổi được chăm sóc (tham chiếu đến elderlies)
 *         start_time:
 *           type: string
 *           format: date-time
 *           description: Thời gian bắt đầu buổi chăm sóc
 *         end_time:
 *           type: string
 *           format: date-time
 *           description: Thời gian kết thúc buổi chăm sóc
 *         location:
 *           type: string
 *           description: Địa chỉ hoặc khu vực chăm sóc
 *         tasks_performed:
 *           type: array
 *           items:
 *             type: string
 *           description: Danh sách các công việc đã thực hiện
 *         vital_signs:
 *           type: object
 *           required:
 *             - blood_pressure_systolic
 *             - blood_pressure_diastolic
 *             - pulse
 *             - respiratory_rate
 *             - temperature
 *             - oxygen_saturation
 *           properties:
 *             blood_pressure_systolic:
 *               type: number
 *               description: Huyết áp tâm thu (mmHg)
 *             blood_pressure_diastolic:
 *               type: number
 *               description: Huyết áp tâm trương (mmHg)
 *             pulse:
 *               type: number
 *               description: Nhịp tim (lần/phút)
 *             respiratory_rate:
 *               type: number
 *               description: Nhịp thở (lần/phút)
 *             temperature:
 *               type: number
 *               description: Nhiệt độ cơ thể (°C)
 *             oxygen_saturation:
 *               type: number
 *               description: SpO2 – Nồng độ Oxy trong máu (%)
 *             weight:
 *               type: number
 *               nullable: true
 *               description: Cân nặng (kg)
 *             height:
 *               type: number
 *               nullable: true
 *               description: Chiều cao (cm)
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Thời gian tạo log
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Lần chỉnh sửa cuối
 */

/**
 * @swagger
 * /service-logs/create-log:
 *   post:
 *     summary: Tạo service log (nurse ghi nhận buổi chăm sóc)
 *     tags: [ServiceLog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceLog'
 *           example:
 *             elderly_id: elderly_001
 *             start_time: "2023-10-01T08:00:00Z"
 *             end_time: "2023-10-01T10:00:00Z"
 *             location: "Quận 1, TP.HCM"
 *             tasks_performed:
 *               - "Đo huyết áp"
 *               - "Kiểm tra nhịp tim"
 *               - "Hỗ trợ vận động"
 *             vital_signs:
 *               blood_pressure_systolic: 120
 *               blood_pressure_diastolic: 80
 *               pulse: 72
 *               respiratory_rate: 16
 *               temperature: 36.8
 *               oxygen_saturation: 98
 *               weight: 65.5
 *               height: 160
 *     responses:
 *       201:
 *         description: Đã tạo service log thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceLog'
 *       400:
 *         description: Dữ liệu không hợp lệ
 */

/**
 * @swagger
 * /service-logs/get-logs:
 *   get:
 *     summary: Lấy lịch sử service log (nurse hoặc elderly)
 *     tags: [ServiceLog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nurse_id
 *         schema:
 *           type: string
 *         description: Lọc theo nurse_id (chỉ admin dùng)
 *       - in: query
 *         name: elderly_id
 *         schema:
 *           type: string
 *         description: Lọc theo elderly_id (chỉ admin dùng)
 *     responses:
 *       200:
 *         description: Danh sách service log, mỗi log có tổng giờ chăm sóc
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/ServiceLog'
 *                   - type: object
 *                     properties:
 *                       total_hours:
 *                         type: number
 *                         description: Tổng số giờ chăm sóc (giờ, làm tròn 2 số thập phân)
 */
// Nurse tạo log
router.post("/create-log", auth, permit("nurse"), createLog);

// Xem lịch sử log
router.get("/get-logs", auth, getLogs);

/**
 * @swagger
 * /service-logs/{id}:
 *   put:
 *     summary: Cập nhật service log (nurse hoặc admin)
 *     tags: [ServiceLog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của service log
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServiceLog'
 *     responses:
 *       200:
 *         description: Đã cập nhật service log thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceLog'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Service log không tồn tại
 */
router.put('/:id', auth, permit('nurse', 'admin'), updateLog);

module.exports = router