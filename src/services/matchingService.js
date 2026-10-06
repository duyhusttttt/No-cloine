const Matching = require('../models/MatchingModel');
const Contract = require('../models/ContractModel');
const ApiError = require('../utils/apiError');
const {sendVerificationEmail} = require('../services/helperService');
const {User} = require('../models/UserModel');
const Nurse = require('../models/NurseModel');
const redis = require('../../config/redisClient') 
const crypto = require('crypto');
const Elderly = require('../models/ElderiesModel');
const web3 = require('../../config/web3Client');
const { abi: contractABI }  = require('../abi/PhucHwaContract.json'); 
require('dotenv').config();

const OTP_EXPIRE_SEC = 3600; // 1 hour

const createMatchingService = async (user, { nurse_id, service_level, booking_time }) => {
  if (user.role !== 'elderly') {
    throw new ApiError(403, 'Only elderly can create matching');
  }
  if (!nurse_id || !service_level || !booking_time) {
    throw new ApiError(400, 'Missing required fields');
  }
  if (!Array.isArray(booking_time) ||
      booking_time.some(bt => !bt.start_time || !bt.end_time)) {
    throw new ApiError(400, 'Invalid booking_time format');
  }
  // Kiểm tra nurse_id có tồn tại không
  const nurse = await Nurse.findOne({ nurse_id });
  if (!nurse) throw new ApiError(404, 'Nurse not found');

  const elderly = await Elderly.findOne({ user_id: user.user_id });
  

  const newMatch = await Matching.create({
    nurse_id,
    elderly_id:   elderly.elderly_id,
    service_level,
    booking_time,
    contract_status: {
      elderly_signature: null,
      nurse_signature:   null,
      contract_hash:     null,
      is_signed:         false
    },
    violation_report: null,
    isMatched:       false,
    matchedAt:       null,
    resetAt:         new Date()
  });

  nurse.isMatched = false; // Cập nhật trạng thái y tá đã matched
  await nurse.save();
  return newMatch;
};

const listMatchingService = async ({ page = 1, limit = 20, isMatched, service_level }) => {
  const skip = (page - 1) * limit;
  const filter = {};
  if (typeof isMatched !== 'undefined') filter.isMatched = isMatched === 'true';
  if (service_level) filter.service_level = service_level;

  const [matches, total] = await Promise.all([
    Matching.find(filter).skip(skip).limit(limit),
    Matching.countDocuments(filter)
  ]);
  return { matches, total, page, limit };
};

const getMatchingByIdService = async (id) => {
  const match = await Matching.findById(id);
  if (!match) throw new ApiError(404, 'Matching not found');
  return match;
};

const updateBookingTimeService = async (id, booking_time) => {
  if (!Array.isArray(booking_time)) {
    throw new ApiError(400, 'booking_time must be an array');
  }
  const match = await Matching.findByIdAndUpdate(
    id,
    { booking_time },
    { new: true, runValidators: true }
  );
  if (!match) throw new ApiError(404, 'Matching not found');
  return match;
};

const signContractService = async (id, { role, signature, contract_hash }) => {
  if (!['nurse', 'elderly'].includes(role)) {
    throw new ApiError(400, 'Invalid role for signing');
  }
  const match = await Matching.findById(id);
  if (!match) throw new ApiError(404, 'Matching not found');

  // update appropriate signature
  if (!match.contract_status) {
    match.contract_status = {};
  }
  if (role === 'elderly') {
    match.contract_status.elderly_signature = signature;
  } else {
    match.contract_status.nurse_signature = signature;
  }
  match.contract_status.contract_hash = contract_hash;

  // set is_signed if both present
  if (match.contract_status.elderly_signature && match.contract_status.nurse_signature) {
    match.contract_status.is_signed = true;
  }
  await match.save();
  return match;
};

const reportViolationService = async (id, { reported_by, reason }) => {
  const match = await Matching.findById(id);
  if (!match) throw new ApiError(404, 'Matching not found');
  match.violation_report = { reported_by, reason, timestamp: new Date() };
  // optionally unmatch
  match.isMatched = false;
  await match.save();
  return match;
};

const completeMatchService = async (id) => {
  const match = await Matching.findById(id);
  if (!match) throw new ApiError(404, 'Matching not found');
  if (!match.contract_status || !match.contract_status.is_signed) {
    throw new ApiError(400, 'Contract must be signed by both parties');
  }
  match.isMatched = true;
  match.matchedAt = new Date();
  await match.save();
  return match;
};

const resetMatchService = async (id) => {
  const match = await Matching.findById(id);
  if (!match) throw new ApiError(404, 'Matching not found');
  match.isMatched = false;
  match.resetAt = new Date();
  await match.save();
  return match;
};

const deleteMatchingService = async (id) => {
  const match = await Matching.findByIdAndDelete(id);
  if (!match) throw new ApiError(404, 'Matching not found');
  return { message: 'Matching deleted' };
};

async function requestSignOtpService(matchingId, role, email) {
  if (!['elderly','nurse'].includes(role)) {
    throw new ApiError(400,'Role phải là elderly hoặc nurse');
  }
  // Tạo OTP 6 chữ số
  const otp = crypto.randomInt(100000, 1000000).toString();
  // Lưu Redis: key = matching:{id}:sign:{role}, value = otp
  const key = `matching:${matchingId}:sign:${role}`;
  await redis.set(key, otp, 'EX', OTP_EXPIRE_SEC);
  // Gửi email
  await sendVerificationEmail(email, otp);
  return { message: `OTP đã gửi đến email của ${role}` };
}

async function confirmSignContractService(matchingId, role, otp, userId) {
  if (!['elderly','nurse'].includes(role)) {
    throw new ApiError(400, 'Role phải là "elderly" hoặc "nurse"');
  }

  // 1. Kiểm tra OTP
  const key = `matching:${matchingId}:sign:${role}`;
  const storedOtp = await redis.get(key);
  if (!storedOtp) throw new ApiError(400, 'OTP đã hết hạn hoặc không tồn tại');
  if (storedOtp !== otp) throw new ApiError(400, 'OTP không hợp lệ');
  await redis.del(key);

  // 2. Cập nhật Matching.contract_status
  const match = await Matching.findById(matchingId);
  if (!match) throw new ApiError(404, 'Matching không tìm thấy');

    const elderly = await Elderly.findOne({ elderly_id: match.elderly_id }).select('evm_address');
    const nurse = await Nurse.findOne({ nurse_id: match.nurse_id }).select('evm_address');
    if (!elderly || !elderly.evm_address) {
        throw new ApiError(400, 'Elderly EVM address not found.');
    }
    if (!nurse || !nurse.evm_address) {
        throw new ApiError(400, 'Nurse EVM address not found.');
    }

      const elderlyEVMAddress = elderly.evm_address;
  const nurseEVMAddress = nurse.evm_address;

  match.contract_status = match.contract_status || {
    elderly_signature: false,
    nurse_signature:   false,
    contract_hash:     null,
    is_signed:         false
  };

  match.contract_status[`${role}_signature`] = true;  

  // Nếu cả hai bên đã ký, thực hiện giao dịch blockchain
    if (match.contract_status.elderly_signature && match.contract_status.nurse_signature) {
        match.contract_status.is_signed = true;
        match.isMatched = true;
        match.matchedAt = new Date();


        const contractAddress = process.env.CONTRACT_ADDRESS; // Lấy từ .env
        const myContract = new web3.eth.Contract(contractABI, contractAddress);
        const senderAddress = process.env.ADMIN_WALLET_ADDRESS; // Địa chỉ ví admin/hệ thống
        const privateKey = process.env.ADMIN_WALLET_PRIVATE_KEY; // Khóa riêng tư ví admin/hệ thống (CHỈ DÙNG CHO DEMO/TEST)

        try {
            // Gọi hàm `recordSignedContract` trên smart contract
            // THAY THẾ 'recordSignedContract' BẰNG TÊN HÀM THẬT CỦA BẠN TRONG SC
            const contractMethod = myContract.methods.recordSignedContract(
                matchingId,
                elderlyEVMAddress,
                nurseEVMAddress
            );
            const encodedABI = contractMethod.encodeABI();

            const gasLimit = await contractMethod.estimateGas({ from: senderAddress });
            const gasPrice = await web3.eth.getGasPrice();

            const signedTx = await web3.eth.accounts.signTransaction(
                {
                   from: senderAddress, 
                    to: contractAddress,
                    data: encodedABI,
                    gas: gasLimit,
                    gasPrice: gasPrice
                },
                privateKey
            );

            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            console.log('Blockchain transaction for contract signing successful:', receipt.transactionHash);

            // Cập nhật contract_hash trong MongoDB bằng hash của giao dịch blockchain
            match.contract_status.contract_hash = receipt.transactionHash;

        } catch (blockchainError) {
            console.error('Blockchain interaction failed for contract signing:', blockchainError);
            // Nếu giao dịch blockchain thất bại, bạn có thể cân nhắc reset is_signed hoặc ghi chú lỗi
            // Trong trường hợp này, nếu giao dịch blockchain thất bại, chúng ta sẽ throw lỗi
            throw new ApiError(500, 'Failed to record contract signing on blockchain: ' + blockchainError.message);
        }
    }
    await match.save(); 
  // // nếu cần bật is_signed ở matching, giữ nguyên logic
  const now = new Date();
  // if (match.contract_status.elderly_signature && match.contract_status.nurse_signature) {
  //   match.contract_status.is_signed = true;
  //   match.isMatched = true; // nếu cả 2 đã ký, coi như đã matched
  //   match.matchedAt = now;
  // }
  // await match.save();

  // 3. Cập nhật Contract: chỉ set chữ ký và log
  
  const updateFields = {
    last_modified_at: now,
    [`signed_by_${role}`]: now,
    [`${role}_signature`]: true,
  };
  const historyEntry = {
    action: `${role}_signed`,
    modified_by: userId,
    timestamp: now
  };

  await Contract.findOneAndUpdate(
    { matching_id: matchingId },
    {
      $set: updateFields,
      $push: { history_logs: historyEntry }
    },
    { new: true }
  );

  

  return match;
}

module.exports = {
  createMatchingService,
  listMatchingService,
  getMatchingByIdService,
  updateBookingTimeService,
  signContractService,
  reportViolationService,
  completeMatchService,
  resetMatchService,
  deleteMatchingService,
  requestSignOtpService,
  confirmSignContractService
};