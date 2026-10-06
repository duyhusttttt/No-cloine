  // services/transactionService.js
  require('dotenv').config();
  const Transaction = require('../models/TransactionModel');
  const ApiError    = require('../utils/apiError');
  const { User, Nurse, Elderly } = require('../models/UserModel');
  const NurseProfile = require('../models/NurseModel'); // Import NurseModel để lấy evm_address
  const ElderlyProfile = require('../models/ElderiesModel'); 
  const Contract = require('../models/ContractModel');
const Pricing = require('../models/PricingModel');
  const { v4: uuidv4 } = require('uuid')
  const web3 = require('../../config/web3Client');
const { abi: tokenABI } = require('../abi/MyToken.json'); 

  // Helper: Tính toán phí nền tảng dựa trên service level
async function calculatePlatformFee(service_type, amount) {
  const pricing = await Pricing.findOne({ service_level: service_type });
  if (!pricing) throw new ApiError(404, 'Pricing not found for service level');
  
  return amount * (pricing.platform_share_percentage / 100);
}

// Lấy tỷ giá hối đoái từ .env
// Đảm bảo PHT_VND_EXCHANGE_RATE được định nghĩa trong .env và là một số hợp lệ
const PHT_VND_EXCHANGE_RATE = parseFloat(process.env.PHT_VND_EXCHANGE_RATE || '1');
if (isNaN(PHT_VND_EXCHANGE_RATE) || PHT_VND_EXCHANGE_RATE <= 0) {
    console.error("PHT_VND_EXCHANGE_RATE in .env is invalid. Defaulting to 100000.");
    // Bạn có thể chọn throw error cứng ở đây nếu muốn
    PHT_VND_EXCHANGE_RATE = 100000;
}

 // Tạo giao dịch từ hợp đồng
async function createTransactionFromContractService(contractId) {
   const existingTx = await Transaction.findOne({ contract_id: contractId });
  if (existingTx) {
    throw new ApiError(400, 'Transaction already exists for this contract');
  }
  const contract = await Contract.findById(contractId);
  if (!contract) throw new ApiError(404, 'Contract not found');

   const paymentDetails = contract.payment_details || {};
  const service_type = paymentDetails?.service_level;
  const amount = paymentDetails.price_per_hour * paymentDetails.total_hours_booked;
  const currency = paymentDetails?.currency || 'VND';

    // Kiểm tra nếu service_type vẫn là null/undefined (nếu payment_details chưa được điền đúng)
  if (!service_type || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new ApiError(400, 'Invalid or incomplete payment details in contract for transaction creation. Ensure service_level, price_per_hour, total_hours_booked are valid numbers and provided.');
  }

  const platform_fee = await calculatePlatformFee(service_type, amount);
  const nurse_receive_amount = amount - platform_fee;

  const tx = await Transaction.create({
    transaction_id: uuidv4(),
    elderly_id: contract.elderly_id,
    nurse_id: contract.nurse_id,
    amount,
    currency,
    service_type: service_type,
    platform_fee,
    nurse_receive_amount,
  payment_method: currency === 'VND' ? 'bank_transfer' : 'smart_contract_transfer', 
    contract_id: contractId,
    status: 'pending'
  });

  return tx;
}

// Xử lý thanh toán 
async function processPaymentService(transactionId, userId, role) {
  
 

  const tx = await Transaction.findOne({ transaction_id: transactionId });
  if (!tx) throw new ApiError(404, 'Transaction not found');

   // Lấy ElderlyProfile của người dùng hiện tại (dựa trên userId = User.user_id)
  const currentUserElderlyProfile = await ElderlyProfile.findOne({ user_id: userId }).select('elderly_id');

  // Chỉ elderly mới được thực hiện thanh toán
  if (role !== 'elderly' || !currentUserElderlyProfile || tx.elderly_id !== currentUserElderlyProfile.elderly_id) {
    throw new ApiError(403, 'Unauthorized payment attempt');
  }

  // Lấy ElderlyProfile để có evm_address từ Elderly.elderly_id của transaction
  const elderlyProfile = await ElderlyProfile.findOne({ elderly_id: tx.elderly_id });
  if (!elderlyProfile || !elderlyProfile.evm_address) {
    throw new ApiError(400, 'Elderly EVM address not found in database for payment.');
  }

  // Lấy NurseProfile để có evm_address từ Nurse.nurse_id của transaction
  const nurseProfile = await NurseProfile.findOne({ nurse_id: tx.nurse_id });
  if (!nurseProfile || !nurseProfile.evm_address) {
    throw new ApiError(400, 'Nurse EVM address not found in database for payment.');
  }

  if (tx.status !== 'pending') {
    throw new ApiError(400, 'Only pending transactions can be processed');
  }

  // ***** LOGIC THANH TOÁN THỰC TẾ TRÊN BLOCKCHAIN HOẶC MOCK *****
  if (tx.currency === 'PlatformToken') { // Giả sử bạn thanh toán bằng token riêng của mình
    const tokenAddress = process.env.TOKEN_ADDRESS;
    const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);

    // Lấy địa chỉ ví EVM của người gửi và người nhận từ profile
    const senderEVMAddress = elderlyProfile.evm_address;
    const receiverEVMAddress = nurseProfile.evm_address;

    // Lấy private key của người gửi để ký giao dịch
    // CẢNH BÁO: ĐÂY LÀ ĐIỂM RẤT NHẠY CẢM VỀ BẢO MẬT.
    // TRONG MÔI TRƯỜNG THẬT, ELDERLY PHẢI KÝ GIAO DỊCH TỪ VÍ CỦA HỌ TRÊN FRONTEND.
    // Dưới đây là cách dùng private key từ .env cho DEMO/TEST.
    const senderPrivateKey = process.env.ELDERLY_MOCK_PRIVATE_KEY; // Hoặc lấy từ DB nếu bạn lưu (không khuyến khích)

    if (!senderPrivateKey) {
      throw new ApiError(500, 'ELDERLY_MOCK_PRIVATE_KEY not set for blockchain payment.');
    }

    try {
      // Kiểm tra số dư token của người gửi (Elderly)
      const senderBalance = await tokenContract.methods.balanceOf(senderEVMAddress).call();
      // Chuyển đổi số tiền giao dịch từ đơn vị token (ví dụ: ETH) sang wei
          // Bước 1: Chuyển đổi tx.amount (VND) sang số lượng PHT
    // Ví dụ: tx.amount = 2,000,000 VND, PHT_VND_EXCHANGE_RATE = 1000 VND/PHT
    // -> amountInPHT = 2,000,000 / 1000 = 2000 PHT
    const amountInPHT = tx.amount / PHT_VND_EXCHANGE_RATE;
     const roundedAmountInPHT = Math.round(amountInPHT); // HOẶC Math.floor(amountInPHT) nếu bạn muốn làm tròn xuống

      if (roundedAmountInPHT <= 0) { // Kiểm tra sau khi làm tròn
          throw new ApiError(400, 'Calculated PlatformToken amount is zero or negative after exchange rate conversion. Check transaction amount and exchange rate.');
      }

  // web3.utils.toBigInt(18) cũng tạo ra BigInt, nhưng dùng 18n rõ ràng hơn cho số cố định.
      const amountInWei = web3.utils.toBigInt(roundedAmountInPHT) * (10n ** 18n);
 

      if (senderBalance < amountInWei) {
        throw new ApiError(400, 'Insufficient PlatformToken balance for transaction.');
      }

      // Gọi hàm transfer trên hợp đồng token: transfer(địa_chỉ_người_nhận, số_lượng)
      const transferMethod = tokenContract.methods.transfer(receiverEVMAddress, amountInWei);
      const encodedABI = transferMethod.encodeABI();

      // Ước tính gas và gửi giao dịch
       // THAY ĐỔI GAS LIMIT Ở ĐÂY: TĂNG THÊM 50% SO VỚI ƯỚC TÍNH HOẶC DÙNG GIỚI HẠN CỐ ĐỊNH CAO
      // gasLimit = ước tính * 1.5, HOẶC gasLimit = 300000 (một giá trị an toàn cho ERC20 transfer)
      const estimatedGas = await transferMethod.estimateGas({ from: senderEVMAddress });
      // Để nhân với 1.5 (tức là 150%), chúng ta nhân với 150n và chia cho 100n
      const gasLimit = (estimatedGas * 150n) / 100n;   
      
      const gasPrice = await web3.eth.getGasPrice();

     

      const signedTx = await web3.eth.accounts.signTransaction(
        {
          from: senderEVMAddress, 
          to: tokenAddress, // Địa chỉ smart contract Token
          data: encodedABI,
          gas: gasLimit,
          gasPrice: gasPrice
        },
        senderPrivateKey
      );



      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      console.log('Blockchain token transfer successful. Tx Hash:', receipt.transactionHash);

      tx.status = 'completed';
      // Nếu bạn có trường blockchain_tx_hash trong TransactionModel, hãy cập nhật nó
      // tx.blockchain_tx_hash = receipt.transactionHash;

    } catch (blockchainError) {
      console.error('Blockchain token transfer failed:', blockchainError);
      tx.status = 'failed';
      // Thêm chi tiết lỗi vào ghi chú giao dịch nếu cần
      tx.note = `Blockchain transfer failed: ${blockchainError.message}`;
        if (blockchainError.receipt) {
          console.error("[DEBUG] Transaction Receipt (for reverted tx):", blockchainError.receipt);
      }
      if (blockchainError.reason) { // Một số lỗi có reason field
          console.error("[DEBUG] Revert Reason:", blockchainError.reason);
      }
      throw new ApiError(500, 'Blockchain payment failed: ' + blockchainError.message);
    }
  } else if (tx.currency === 'VND') {
    // Giữ lại mockBankPayment cho VND nếu bạn không muốn xử lý VND trên blockchain
    const paymentSuccess = mockBankPayment(tx); // Hàm mock đã có sẵn
    if (paymentSuccess) {
      tx.status = 'completed';
    } else {
      tx.status = 'failed';
      throw new ApiError(402, 'Payment failed');
    }
  } else {
    throw new ApiError(400, `Unsupported currency: ${tx.currency}`);
  }

  await tx.save(); // Lưu trạng thái transaction
  // Cập nhật hợp đồng (lưu transaction_id vào payment_details)
  await Contract.findByIdAndUpdate(
    tx.contract_id,
    { $set: { 'payment_details.transaction_id': tx.transaction_id } }
  );

  return tx;
}


// Mock bank payment
function mockBankPayment(transaction) {
  // Trong thực tế sẽ gọi API ngân hàng ở đây
  return Math.random() > 0.1; // 90% thành công
}

function mockBankRefund(transaction) {
  return Math.random() > 0.8; // 80% thành công
}

// Hoàn tiền
async function refundTransactionService(transactionId, reason) {
  const tx = await Transaction.findOne({ transaction_id: transactionId });
  if (!tx) throw new ApiError(404, 'Transaction not found');

  if (tx.status !== 'completed') {
    throw new ApiError(400, 'Only completed transactions can be refunded');
  }

  // ***** LOGIC HOÀN TIỀN THỰC TẾ TRÊN BLOCKCHAIN HOẶC MOCK *****
  if (tx.currency === 'PlatformToken') {
    const tokenAddress = process.env.TOKEN_ADDRESS;
    const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);

    // Để hoàn tiền, cần biết ai sẽ gửi (platform/nurse) và ai nhận (elderly)
    // Giả sử platform/admin gửi tiền hoàn lại cho elderly
    const senderEVMAddress = process.env.ADMIN_WALLET_ADDRESS; // Ví admin/platform
    const senderPrivateKey = process.env.ADMIN_WALLET_PRIVATE_KEY; // Private key admin/platform
    const receiverEVMAddress = (await ElderlyProfile.findOne({ elderly_id: tx.elderly_id }))?.evm_address;

    if (!receiverEVMAddress) {
      throw new ApiError(400, 'Elderly EVM address not found for refund.');
    }

    try {
        const refundAmountInPHT = tx.amount / PHT_VND_EXCHANGE_RATE; // Chuyển VND sang PHT cho refund
        console.log(`[DEBUG_REFUND_PROCESS] --- START REFUND DEBUG ---`);
        console.log(`[DEBUG_REFUND_PROCESS] Elderly USER ID: ${tx.elderly_id}`);
        console.log(`[DEBUG_REFUND_PROCESS] Refund Amount (VND): ${tx.amount}`);
        console.log(`[DEBUG_REFUND_PROCESS] Exchange Rate: ${PHT_VND_EXCHANGE_RATE}`);

    const roundedRefundAmountInPHT = Math.round(refundAmountInPHT); // Làm tròn
    if (roundedRefundAmountInPHT <= 0) {
        throw new ApiError(400, 'Calculated PlatformToken refund amount is zero or negative.');
    }
    const amountInWei = web3.utils.toBigInt(roundedRefundAmountInPHT) * (10n ** 18n);
      const transferMethod = tokenContract.methods.transfer(receiverEVMAddress, amountInWei);
      const encodedABI = transferMethod.encodeABI();

      const gasLimit = await transferMethod.estimateGas({ from: senderEVMAddress });
      const gasPrice = await web3.eth.getGasPrice();

      const signedTx = await web3.eth.accounts.signTransaction(
        {
           from: senderEVMAddress,
          to: tokenAddress,
          data: encodedABI,
          gas: gasLimit,
          gasPrice: gasPrice
        },
        senderPrivateKey
      );

      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      console.log('Blockchain token refund successful. Tx Hash:', receipt.transactionHash);

      tx.status = 'cancelled'; // Trạng thái hoàn tiền
      tx.note = reason || 'Refund processed via blockchain.';
      // Cập nhật thêm hash giao dịch blockchain nếu có trường đó

    } catch (blockchainError) {
      console.error('Blockchain token refund failed:', blockchainError);
      tx.status = 'failed';
      tx.note = `Blockchain refund failed: ${blockchainError.message}`;
      throw new ApiError(500, 'Blockchain refund failed: ' + blockchainError.message);
    }

  } else if (tx.currency === 'VND') {
    // Giả lập hoàn tiền qua ngân hàng cho VND
    const refundSuccess = mockBankRefund(tx);
    if (refundSuccess) {
      tx.status = 'cancelled';
      tx.note = reason;
    } else {
      throw new ApiError(500, 'Refund failed');
    }
  } else {
    throw new ApiError(400, `Unsupported currency for refund: ${tx.currency}`);
  }

  await tx.save();
  return tx;
}

// Lấy giao dịch theo người dùng (đã có)
async function getUserTransactionsService(userId, role, { page = 1, limit = 20 }) {
  const filter = {};
  // Dựa vào việc Elderly.user_id = User.user_id và Nurse.user_id = User.user_id
  // Nhưng transaction lại lưu elderly_id và nurse_id (là UUID riêng của Elderly/NurseProfile)
  // Nên cần lookup để tìm đúng.
  if (role === 'elderly') {
    const elderlyProfile = await ElderlyProfile.findOne({ user_id: userId }).select('elderly_id');
    if (!elderlyProfile) throw new ApiError(404, 'Elderly profile not found.');
    filter.elderly_id = elderlyProfile.elderly_id;
  } else if (role === 'nurse') {
    const nurseProfile = await NurseProfile.findOne({ user_id: userId }).select('nurse_id');
    if (!nurseProfile) throw new ApiError(404, 'Nurse profile not found.');
    filter.nurse_id = nurseProfile.nurse_id;
  } else {
      // Admin có thể xem tất cả
      if (userId) { // Nếu admin muốn lọc theo user_id, cần chuyển đổi sang elderly_id/nurse_id
          const foundElderly = await ElderlyProfile.findOne({ user_id: userId }).select('elderly_id');
          if (foundElderly) filter.elderly_id = foundElderly.elderly_id;
          const foundNurse = await NurseProfile.findOne({ user_id: userId }).select('nurse_id');
          if (foundNurse) filter.nurse_id = foundNurse.nurse_id;
      }
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Transaction.find(filter).skip(skip).limit(limit).sort({ created_at: -1 }),
    Transaction.countDocuments(filter)
  ]);

  return { items, total, page, limit };
}

async function listTransactionsService({ page = 1, limit = 20, status, elderly_id, nurse_id }) {
  const filter = {};
  if (status) filter.status = status;
  // elderly_id và nurse_id ở đây là ID của ElderlyProfile và NurseProfile
  if (elderly_id) filter.elderly_id = elderly_id;
  if (nurse_id) filter.nurse_id = nurse_id;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Transaction.find(filter).skip(skip).limit(limit),
    Transaction.countDocuments(filter)
  ]);

  return { items, total, page, limit };
}


  async function updateTransactionStatusService(transactionId, newStatus) {
    const allowed = ['pending','completed','failed','cancelled'];
    if (!allowed.includes(newStatus)) {
      throw new ApiError(400, 'Invalid transaction status');
    }
    const tx = await Transaction.findOneAndUpdate(
      { transaction_id: transactionId },
      { status: newStatus },
      { new: true, runValidators: true }
    );
    if (!tx) throw new ApiError(404, 'Transaction not found');
    return tx;
  }


  module.exports = {
    createTransactionFromContractService,
    processPaymentService,
    refundTransactionService,
    getUserTransactionsService,
    listTransactionsService,
    updateTransactionStatusService
  };