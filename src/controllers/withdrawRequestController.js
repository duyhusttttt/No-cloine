// src/controllers/withdrawRequestController.js
const withdrawRequestService = require('../services/withdrawRequestService');
const ApiError = require('../utils/apiError');
const Nurse = require('../models/NurseModel'); // Import NurseModel để tìm nurse_id từ user_id


// Controller để tạo yêu cầu rút tiền mới
const createWithdrawRequest = async (req, res, next) => {
    try {
        const { amount, bank_account_info } = req.body;
        // req.user.user_id là user_id (UUID của tài khoản User) từ token
        const loggedInUserId = req.user.user_id; 

        // --- FIX START: Lấy NurseProfile.nurse_id từ User.user_id ---
        const nurseProfile = await Nurse.findOne({ user_id: loggedInUserId }).select('nurse_id');
        if (!nurseProfile || !nurseProfile.nurse_id) {
            throw new ApiError(404, 'Nurse profile not found for the logged-in user. Please ensure your nurse profile is complete.');
        }
        const nurse_id_for_request = nurseProfile.nurse_id; // Đây là NurseProfile.nurse_id (UUID)
        // --- FIX END ---

        const newRequest = await withdrawRequestService.createWithdrawRequestService({
            nurse_id: nurse_id_for_request, // Truyền NurseProfile.nurse_id đúng
            amount,
            bank_account_info
        });
        res.status(201).json({ success: true, data: newRequest });
    } catch (err) {
        next(err);
    }
};

// Controller để xử lý yêu cầu rút tiền (phê duyệt/từ chối/hoàn thành - chỉ admin)
const processWithdrawRequest = async (req, res, next) => {
    try {
        const { id } = req.params; // withdraw_request_id
        const { status, note } = req.body; // Bổ sung 'note' cho admin nếu có

        // Chỉ admin mới được phép xử lý yêu cầu này, đã xử lý ở middleware permit
        const updatedRequest = await withdrawRequestService.processWithdrawRequestService(id, status, note);
        res.status(200).json({ success: true, data: updatedRequest });
    } catch (err) {
        next(err);
    }
};

// Controller để liệt kê các yêu cầu rút tiền
const listWithdrawRequests = async (req, res, next) => {
    try {
        const { page, limit, status, nurse_id } = req.query; // nurse_id có thể là NurseProfile.nurse_id hoặc User.user_id (nếu admin lọc)

        // Nếu người dùng không phải admin và muốn xem yêu cầu của chính mình
        let filterNurseId = nurse_id;
        if (req.user.role === 'nurse' && !nurse_id) { // Nếu nurse xem yêu cầu của mình mà không truyền nurse_id filter
            const nurseProfile = await Nurse.findOne({ user_id: req.user.user_id }).select('nurse_id');
            if (!nurseProfile) throw new ApiError(404, 'Nurse profile not found for the logged-in user.');
            filterNurseId = nurseProfile.nurse_id;
        } else if (req.user.role === 'elderly') { // Elderly không có quyền xem
            throw new ApiError(403, 'Forbidden: Elderly users cannot view withdrawal requests.');
        }
        // Admin có thể truyền nurse_id cụ thể, hoặc xem tất cả nếu không truyền

        const result = await withdrawRequestService.listWithdrawRequestsService({
            page: parseInt(page),
            limit: parseInt(limit),
            status,
            nurse_id: filterNurseId // Sử dụng filterNurseId sau khi xử lý
        });
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createWithdrawRequest,
    processWithdrawRequest,
    listWithdrawRequests
};