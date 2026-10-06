const {
  createTransactionFromContractService,
  processPaymentService,
  refundTransactionService,
  getUserTransactionsService,
  listTransactionsService,
  updateTransactionStatusService,
  getTransactionByIdService
} = require('../services/transactionService');
const ApiError = require('../utils/apiError');

// Tạo transaction từ hợp đồng
const createFromContract = async (req, res, next) => {
  try {
    const tx = await createTransactionFromContractService(req.params.contractId);
    res.status(201).json({ success: true, data: tx });
  } catch (error) {
    next(error);
  }
};

// Xử lý thanh toán (elderly)
const processPayment = async (req, res, next) => {
  try {
    const tx = await processPaymentService(
      req.params.transactionId,
      req.user.user_id,
      req.user.role
    );
    res.json({ success: true, data: tx });
  } catch (error) {
    next(error);
  }
};

// Hoàn tiền (admin)
const refund = async (req, res, next) => {
  try {
    const tx = await refundTransactionService(
      req.params.transactionId,
      req.body.reason
    );
    res.json({ success: true, data: tx });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách giao dịch của user hiện tại
const getUserTransactions = async (req, res, next) => {
  try {
    const result = await getUserTransactionsService(
      req.user.user_id,
      req.user.role,
      req.query
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách giao dịch (lọc, phân trang)
const listTransactions = async (req, res, next) => {
  try {
    const { page, limit, status, elderly_id, nurse_id } = req.query;
    const result = await listTransactionsService({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
      elderly_id,
      nurse_id
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// Lấy chi tiết giao dịch theo id
const getTransactionById = async (req, res, next) => {
  try {
    const tx = await getTransactionByIdService(req.params.id);
    if (!tx) throw new ApiError(404, 'Không tìm thấy giao dịch');
    res.json({ success: true, data: tx });
  } catch (err) {
    next(err);
  }
};

// Cập nhật trạng thái giao dịch (admin)
const updateTransactionStatus = async (req, res, next) => {
  try {
    const tx = await updateTransactionStatusService(
      req.params.transactionId,
      req.body.status
    );
    res.json({ success: true, data: tx });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createFromContract,
  processPayment,
  refund,
  getUserTransactions,
  listTransactions,
  getTransactionById,
  updateTransactionStatus
};