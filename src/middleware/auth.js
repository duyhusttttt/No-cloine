const jwt = require('jsonwebtoken');
require('dotenv').config();
const ApiError = require('../utils/apiError');
const User = require('../models/UserModel').User; // Import User for optional email_verified check

// Các đường public không cần auth
const publicPaths = [
  '/register',
  '/login',
  '/send-verify-email',
  '/verify-account'
];

/**
 * Middleware xác thực JWT
 */
const auth = async (req, res, next) => {
  try {
    // Bỏ qua public paths
    if (publicPaths.includes(req.path)) {
      return next();
    }

    // Lấy và validate header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authorization token is missing or invalid');
    }
    const token = authHeader.split(' ')[1];
    req.token = token;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token expired');
      }
      throw new ApiError(401, 'Token is invalid');
    }

    // Gắn user info từ token
    req.user = {
      user_id: decoded.user_id,
      email: decoded.email,
      role: decoded.role
    };

    // Kiểm tra email đã verify chưa
    const user = await User.findOne({ user_id: decoded.user_id }).select('email_verified');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    if (!user.email_verified) {
      throw new ApiError(403, 'Email not verified');
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware phân quyền theo role
 * @param  {...string} allowedRoles - danh sách role được phép truy cập
 */
const permit = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden'));
  }
  next();
};

module.exports = { auth, permit };
