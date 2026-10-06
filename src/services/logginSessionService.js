const LoginSession = require('../models/LoginSessionModel');
const ApiError = require('../utils/apiError');

// Tạo phiên đăng nhập mới
const createLoggingSession = async ({ user_id, role, token, card_id = null, signature = null }) => {
  try {
      

    const session = await LoginSession.create({
      user_id, role, token, card_id, signature
    });
    return session;
  } catch (err) {
    // Duplicate token?
    if (err.code === 11000 && err.keyPattern && err.keyPattern.token) {
      throw new ApiError(409, 'Session token already exists');
    }
    throw new ApiError(500, 'Failed to create logging session');
  }
};


// Cập nhật thời gian đăng xuất
const updateLogoutTime = async (token) => {
  const session = await LoginSession.findOneAndUpdate(
    { token, logout_time: null },           // chỉ cập nhật session đang mở
    { logout_time: new Date() },
    { new: true }
  );
  if (!session) {
    throw new ApiError(404, 'Active session not found for this token');
  }
  return session;
};

module.exports = {
  createLoggingSession,
  updateLogoutTime
};