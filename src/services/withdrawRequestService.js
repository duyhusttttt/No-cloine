// src/services/withdrawRequestService.js
const WithdrawRequest = require('../models/WithdrawRequestModel'); // Import mô hình WithdrawRequest
const Card = require('../models/CardModel'); // Để kiểm tra và cập nhật số dư ví
const Nurse = require('../models/NurseModel'); // Để kiểm tra nurse_id
const ApiError = require('../utils/apiError');
const { v4: uuidv4 } = require('uuid');
const web3 = require('../../config/web3Client');
require('dotenv').config(); // Để sử dụng biến môi trường từ .env

// Lấy tỷ giá hối đoái từ .env
const PHT_VND_EXCHANGE_RATE = parseFloat(process.env.PHT_VND_EXCHANGE_RATE || '1');
if (isNaN(PHT_VND_EXCHANGE_RATE) || PHT_VND_EXCHANGE_RATE <= 0) {
    console.error("PHT_VND_EXCHANGE_RATE in .env is invalid. Defaulting to 100000.");
    // Bạn có thể chọn throw error cứng ở đây nếu muốn
    PHT_VND_EXCHANGE_RATE = 100000;
}

// Hàm để tạo yêu cầu rút tiền mới
const createWithdrawRequestService = async ({ nurse_id, amount, bank_account_info }) => {
  // Validate đầu vào
    if (!nurse_id || !amount || typeof amount !== 'number' || isNaN(amount) || amount <= 0 || !bank_account_info || !bank_account_info.account_number || !bank_account_info.bank_name) {
        throw new ApiError(400, 'Nurse ID, positive Amount, and valid Bank Account Info (account_number, bank_name) are required.');
    }


  // Kiểm tra nurse có tồn tại không
  const nurseProfile  = await Nurse.findOne({ nurse_id });
  if (!nurseProfile) {
    throw new ApiError(404, 'Nurse not found.');
  }

   // Lấy Card của nurse dựa trên User.user_id của NurseProfile
    const nurseCard = await Card.findOne({ user_id: nurseProfile.user_id }); 
    if (!nurseCard) {
        throw new ApiError(404, 'Nurse card (wallet) not found.');
    }

    
     // `amount` từ request (VND) cần được chuyển đổi sang số lượng PHT để so sánh với nurseCard.balance (human-readable PHT).
    const requestedAmountInPHT = Math.round(amount / PHT_VND_EXCHANGE_RATE); // Yêu cầu rút tiền bằng PHT
    
    if (requestedAmountInPHT <= 0) {
        throw new ApiError(400, 'Calculated PlatformToken withdrawal amount is zero or negative. Check withdrawal amount and exchange rate.');
    }




     // So sánh số dư: nurseCard.balance và requestedAmountInPHT đều là Number (PHT đọc được)
    if (nurseCard.balance < requestedAmountInPHT) { // So sánh Numbers
        throw new ApiError(400, 'Insufficient balance on nurse card for withdrawal.');
    }
   
   const newRequest = await WithdrawRequest.create({
        withdraw_request_id: uuidv4(),
        nurse_id: nurseProfile.nurse_id,
        amount: amount, // Lưu số tiền gốc (VND) vào request
        bank_account_info,
        status: 'pending',
        requested_at: new Date()
    });

  // (Tùy chọn) Việc trừ tiền và cập nhật trạng thái có thể được xử lý bởi một trigger Realm Function
  // khi trạng thái là 'approved' hoặc 'completed'

  return newRequest;
};

// Hàm để xử lý yêu cầu rút tiền (thường là bởi admin)
const processWithdrawRequestService = async (withdraw_request_id, newStatus) => {
    const allowedStatus = ['approved', 'rejected', 'completed'];
    if (!allowedStatus.includes(newStatus)) {
        throw new ApiError(400, 'Invalid status for processing withdrawal request.');
    }

    const request = await WithdrawRequest.findOne({ withdraw_request_id });
    if (!request) {
        throw new ApiError(404, 'Withdrawal request not found.');
    }
    if (request.status !== 'pending') {
        throw new ApiError(400, `Withdrawal request is already ${request.status}. Only pending requests can be processed.`);
    }

    if (newStatus === 'approved' || newStatus === 'completed') {
        // Lấy NurseProfile và User.user_id
        const nurseProfile = await Nurse.findOne({ nurse_id: request.nurse_id }).select('user_id');
        if (!nurseProfile || !nurseProfile.user_id) {
            throw new ApiError(404, 'Nurse profile or associated User ID not found for withdrawal processing.');
        }
        const nurseUserId = nurseProfile.user_id;

        const nurseActualCard = await Card.findOne({ user_id: nurseUserId });
        if (!nurseActualCard) {
            throw new ApiError(404, 'Nurse card (wallet) not found for processing.');
        }


        const amountToDeductInPHT = Math.round(request.amount / PHT_VND_EXCHANGE_RATE);
       

        if (amountToDeductInPHT <= 0) { // Kiểm tra sau khi làm tròn
            throw new ApiError(400, 'Calculated PlatformToken deduction amount is zero or negative. Check withdrawal amount and exchange rate.');
        }

        

        if (nurseActualCard.balance < amountToDeductInPHT) { // So sánh Numbers
            throw new ApiError(400, 'Insufficient PlatformToken balance on nurse card to complete withdrawal after conversion.');
        }

        // Trừ tiền khỏi ví nurse (balance trong human-readable PHT)
        nurseActualCard.balance -= amountToDeductInPHT; // Thực hiện phép trừ Number
        await nurseActualCard.save();
 
 
    }

    request.status = newStatus;
    request.processed_at = new Date();
    await request.save();

    return request;
};

// Hàm để liệt kê các yêu cầu rút tiền
const listWithdrawRequestsService = async ({ page = 1, limit = 20, status, nurse_id }) => {
  const filter = {};
  if (status) filter.status = status;
  if (nurse_id) filter.nurse_id = nurse_id;

  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    WithdrawRequest.find(filter).skip(skip).limit(limit).sort({ requested_at: -1 }),
    WithdrawRequest.countDocuments(filter)
  ]);

  return { requests, total, page, limit };
};

module.exports = {
  createWithdrawRequestService,
  processWithdrawRequestService,
  listWithdrawRequestsService
};