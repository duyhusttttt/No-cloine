const {
  getAllUsersService,
  getUserByIdService,
  createUserService,
  loginService,
  deleteUserService,
  updateUserService,
  sendVerifyEmailService,
  verifyAccountService,
  QRLoginService,
} = require('../services/userService')
const {updateLogoutTime} = require('../services/logginSessionService')
const ApiError = require('../utils/apiError');

const createUser = async (req, res, next) => {
  try {
    const { email, password, role, student_id } = req.body;
    const result = await createUserService({ email, password, role, student_id });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};


const handleLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { access_token, user } = await loginService(email, password);

    res.status(200).json({ success: true, data: { access_token, user } });
  } catch (err) {
    next(err);
  }
};

// Gửi OTP xác thực email
const sendVerifyEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await sendVerifyEmailService(email);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};

// Xác thực OTP
const verifyAccount = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyAccountService(email, otp);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};

const updateLogout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authorization header missing');
    }
    const token = authHeader.split(' ')[1];
    await updateLogoutTime(token);
    res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller: Lấy thông tin account từ JWT middleware
 */
const getAccount = (req, res) => {
  res.status(200).json({ success: true, data: req.user });
};

/**
 * Controller: Lấy tất cả users (admin)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const data = await getAllUsersService({ page: Number(page), limit: Number(limit) });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller: Lấy user theo user_id
 */
const getUserById = async (req, res, next) => {
  try {
    const { id: user_id } = req.params;
    const user = await getUserByIdService(user_id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller: Cập nhật user theo user_id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id: user_id } = req.params;
    const user = await updateUserService(user_id, req.body);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller: Xóa user theo user_id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id: user_id } = req.params;
    await deleteUserService(user_id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const QRLogin = async (req, res, next) => {
 try {
    if (!req.file) throw new ApiError(400, 'Chưa upload file QR');
    const result = await QRLoginService(req.file.buffer);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  handleLogin,
  createUser,
  updateLogout,
  getAccount,
  updateUser,
  deleteUser,
  sendVerifyEmail,
  verifyAccount,
  QRLogin,
};

