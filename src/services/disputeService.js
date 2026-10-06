// src/services/disputeService.js
const Dispute = require('../models/DisputeModel');
const Transaction = require('../models/TransactionModel');
const ApiError = require('../utils/apiError');
const { v4: uuidv4 } = require('uuid');

const Nurse = require('../models/NurseModel'); 
const Elderly = require('../models/ElderiesModel'); 

// Hàm để tạo tranh chấp mới
const createDisputeService = async ({ transaction_id, complainant_id,complainant_role, defendant_id, defendant_role, reason, evidences }) => {
    // Validate đầu vào
    // complainant_id và defendant_id ở đây được giả định là các ID của profile (elderly_id/nurse_id),
    // đã được chuyển đổi từ user_id ở lớp Controller.
     if (!transaction_id || !complainant_id || !complainant_role || !defendant_id || !defendant_role || !reason) { // <-- THÊM validate role
        throw new ApiError(400, 'Transaction ID, Complainant ID, Complainant Role, Defendant ID, Defendant Role, and Reason are required.');
    }

    const transaction = await Transaction.findOne({ transaction_id });
    if (!transaction) {
        throw new ApiError(404, 'Transaction not found.');
    }

    // const existingDispute = await Dispute.findOne({ transaction_id });
    // if (existingDispute) {
    //     throw new ApiError(409, 'A dispute already exists for this transaction.');
    // }


    const newDispute = await Dispute.create({
        dispute_id: uuidv4(),
        transaction_id,
        complainant_id,
        complainant_role,
        defendant_id,
        defendant_role,
        reason,
        evidences: evidences || [], // Đảm bảo evidences là một mảng các URL/chuỗi
        status: 'open', // Trạng thái mặc định khi tạo là 'open'
        created_at: new Date()
    });

    return newDispute;
};

// Hàm để lấy tranh chấp theo ID
const getDisputeByIdService = async (dispute_id) => {
    const dispute = await Dispute.findOne({ dispute_id });
    if (!dispute) {
        throw new ApiError(404, 'Dispute not found.');
    }
    return dispute;
};

// Hàm để cập nhật trạng thái tranh chấp (thường là bởi admin)
const updateDisputeStatusService = async (dispute_id, newStatus, resolution) => {
    // allowedStatuses phải khớp với enum trong DisputeModel
    const allowedStatuses = ['open', 'under_review', 'resolved', 'rejected'];
    if (!allowedStatuses.includes(newStatus)) {
        throw new ApiError(400, 'Invalid dispute status.');
    }

    const updatedDispute = await Dispute.findOneAndUpdate(
        { dispute_id },
        // solved_at chỉ được set khi trạng thái là 'resolved' hoặc 'rejected'
        { status: newStatus, resolution: resolution || null, resolved_at: (newStatus === 'resolved' || newStatus === 'rejected') ? new Date() : null },
        { new: true, runValidators: true }
    );

    if (!updatedDispute) {
        throw new ApiError(404, 'Dispute not found.');
    }

    // Logic xử lý hậu quả tài chính (phạt tiền, hoàn tiền, v.v.)
    // Đã được thiết kế để xảy ra trong Realm Function Trigger (onDisputeStatusUpdate)
    // khi `status` của Dispute thay đổi.
    return updatedDispute;
};

const listDisputesService = async ({ page = 1, limit = 20, status, complainant_id, defendant_id, orFilter = [] }) => {
    const filter = {};
    if (status) filter.status = status;
    if (complainant_id) filter.complainant_id = complainant_id;
    if (defendant_id) filter.defendant_id = defendant_id;

      if (orFilter.length > 0) {
        filter.$or = orFilter;
    }

    const skip = (page - 1) * limit;
    const [disputes, total] = await Promise.all([
        Dispute.find(filter).skip(skip).limit(limit).sort({ created_at: -1 }),
        Dispute.countDocuments(filter)
    ]);
    

    return { disputes, total, page, limit };
};

module.exports = {
    createDisputeService,
    getDisputeByIdService,
    updateDisputeStatusService,
    listDisputesService
};