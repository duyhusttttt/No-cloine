// src/controllers/disputeController.js
const disputeService = require('../services/disputeService');
const ApiError = require('../utils/apiError');
const Nurse = require('../models/NurseModel'); // Import NurseModel
const Elderly = require('../models/ElderiesModel'); // Import ElderlyModel

// Helper function để lấy profile ID (elderly_id hoặc nurse_id) từ user_id
const getProfileInfoFromUserId = async (userId, userRole) => {
    let profile;
    if (userRole === 'elderly') {
        profile = await Elderly.findOne({ user_id: userId }).select('elderly_id');
        return profile ? { id: profile.elderly_id, role: 'elderly' } : null;
    } else if (userRole === 'nurse') {
        profile = await Nurse.findOne({ user_id: userId }).select('nurse_id');
        return profile ? { id: profile.nurse_id, role: 'nurse' } : null;
    }
    return null;
};

// Controller để tạo tranh chấp mới
const createDispute = async (req, res, next) => {
    try {
        const { transaction_id, defendant_id, reason, evidences } = req.body;
        
        
        const loggedInUserId = req.user.user_id; // UUID của User tài khoản từ token
        const loggedInUserRole = req.user.role;

       const complainantProfileInfo = await getProfileInfoFromUserId(loggedInUserId, loggedInUserRole);
        if (!complainantProfileInfo) {
            throw new ApiError(404, `Complainant profile (Elderly/Nurse) not found for user_id: ${loggedInUserId}. Please ensure your profile is complete.`);
        }

         const complainant_id = complainantProfileInfo.id;
        const complainant_role = complainantProfileInfo.role;
      
         let defendant_role;
        const defendantElderlyProfile = await Elderly.findOne({ elderly_id: defendant_id }).select('elderly_id');
        const defendantNurseProfile = await Nurse.findOne({ nurse_id: defendant_id }).select('nurse_id');

        if (defendantElderlyProfile) {
            defendant_role = 'elderly';
        } else if (defendantNurseProfile) {
            defendant_role = 'nurse';
        } else {
            throw new ApiError(404, `Defendant profile (Elderly/Nurse) not found for ID: ${defendant_id}.`);
        }

        const newDispute = await disputeService.createDisputeService({
            transaction_id,
            complainant_id, // Đã là elderly_id hoặc nurse_id
              complainant_role, 
            defendant_id,   // Giả định defendant_id từ request body là profile ID đúng
             defendant_role, 
            reason,
            evidences
        });
        res.status(201).json({ success: true, data: newDispute });
    } catch (err) {
        next(err);
    }
};

// Controller để lấy tranh chấp theo ID
const getDisputeById = async (req, res, next) => {
    try {
        const { id } = req.params; // dispute_id (UUID)
        const dispute = await disputeService.getDisputeByIdService(id);
        res.status(200).json({ success: true, data: dispute });
    } catch (err) {
        next(err);
    }
};

// Controller để cập nhật trạng thái tranh chấp (chỉ admin mới có quyền)
const updateDisputeStatus = async (req, res, next) => {
    try {
        const { id } = req.params; // dispute_id (UUID)
        const { status, resolution } = req.body; // Trạng thái và giải pháp

        // Middleware 'permit('admin')' sẽ kiểm tra quyền ở đây.
        const updatedDispute = await disputeService.updateDisputeStatusService(id, status, resolution);
        res.status(200).json({ success: true, data: updatedDispute });
    } catch (err) {
        next(err);
    }
};

// Controller để liệt kê các tranh chấp với phân trang và lọc
const listDisputes = async (req, res, next) => {
    try {
        const { page, limit, status, complainant_id, defendant_id } = req.query; 

        // Khởi tạo các filter sẽ truyền vào service
        const serviceFilters = {
            page: parseInt(page),
            limit: parseInt(limit),
            status: status // Status filter áp dụng cho mọi trường hợp
        };

        if (req.user.role === 'admin') {
            // ADMIN: Có thể lọc theo complainant_id hoặc defendant_id bất kỳ từ query params
            serviceFilters.complainant_id = complainant_id;
            serviceFilters.defendant_id = defendant_id;
        } else {
            // NGƯỜI DÙNG KHÔNG PHẢI ADMIN (Elderly/Nurse):
            // Chỉ thấy các dispute có liên quan đến profile của họ.
            const loggedInUserId = req.user.user_id;
            const loggedInUserRole = req.user.role;
            const profileInfo = await getProfileInfoFromUserId(loggedInUserId, loggedInUserRole); 

            if (!profileInfo) { 
                throw new ApiError(404, 'User profile not found. Cannot list disputes.');
            }
            const profileId = profileInfo.id; 

            // TẠO FILTER $OR ĐỂ TÌM DISPUTE LIÊN QUAN ĐẾN PROFILE NÀY
            serviceFilters.orFilter = [
                { complainant_id: profileId },
                { defendant_id: profileId }
            ];
            // KHÔNG truyền complainant_id và defendant_id riêng lẻ nữa để tránh xung đột với $or
            // Bất kỳ complainant_id hoặc defendant_id nào được truyền trong query sẽ bị bỏ qua cho non-admins.
        }

        const result = await disputeService.listDisputesService(serviceFilters);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createDispute,
    getDisputeById,
    updateDisputeStatus,
    listDisputes
};