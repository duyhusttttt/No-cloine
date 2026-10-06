require('dotenv').config()

const jsQR = require('jsqr');
const {User, Nurse, Elderly} = require('../models/UserModel')
const ApiError = require('../utils/apiError')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const saltRounds = 12;
const {sendVerificationEmail} = require('./helperService')
const redis = require('../../config/redisClient') 
const {createLoggingSession} = require('./logginSessionService')
const Card = require('../models/CardModel');
const JimpModule = require('jimp');
const Jimp = JimpModule.Jimp; // Lấy class Jimp từ object


const getAllUsersService = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find().skip(skip).limit(limit).select('-password'),
    User.countDocuments()
  ]);
  return { users, total, page, limit };
};

const getUserByIdService = async (user_id) => {
  const user = await User.findOne({ user_id }).select('-password');
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

const createUserService = async ({ email, password, role, student_id }) => {
  // Validate cơ bản
  if (!email || !password || !role) {
    throw new ApiError(400, 'Email, password và role đều bắt buộc');
  }
  if (!['nurse', 'elderly'].includes(role)) {
    throw new ApiError(400, 'Role không hợp lệ (phải là nurse hoặc elderly)');
  }
  if (role === 'nurse' && !student_id) {
    throw new ApiError(400, 'student_id là bắt buộc khi role = nurse');
  }

  // Kiểm tra trùng lặp
  if (await User.findOne({ email })) throw new ApiError(409, 'Email đã tồn tại');
  if (role === 'nurse' && await User.findOne({ student_id })) throw new ApiError(409, 'Student ID đã tồn tại');

  // Hash mật khẩu
  const hashPassword = await bcrypt.hash(password, saltRounds);
  
  // Tạo user qua discriminator
  const newUserData = { email, role, password: hashPassword };
  if (role === 'nurse') newUserData.student_id = student_id;
  const created =
    role === 'nurse'
      ? await Nurse.create(newUserData)
      : await Elderly.create(newUserData);

  // Gửi OTP xác thực email
  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpKey = `otp:${created.email}`;
  await redis.set(otpKey, otp, 'EX', 300);
  await sendVerificationEmail(created.email, otp);

  const user = created.toObject();
  delete user.password;
  return { message: 'User created. Please verify email.', user };
};


const loginService = async (email, password) => {
  if (!email || !password) throw new ApiError(400, 'Email và password là bắt buộc');
  const user = await User.findOne({ email });
  if (!user || !user.password) throw new ApiError(401, 'Invalid Email/Password');
  if (!user.email_verified) throw new ApiError(403, 'Email chưa được xác thực');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new ApiError(401, 'Invalid Email/Password');

  const payload = { user_id: user.user_id, email: user.email, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

  // Ghi session login
  await createLoggingSession({
  user_id: user.user_id,
  role: user.role,
  token,
  card_id: user.card_id || null
});

  return { access_token: token, user: { user_id: user.user_id, email: user.email, role: user.role } };
};

const QRLoginService = async (fileBuffer) => {
  // 1. Đọc ảnh từ buffer
  const img = await Jimp.read(fileBuffer);
  const { data, width, height } = img.bitmap;

  // 2. Giải mã QR
  const code = jsQR(data, width, height);
  if (!code) throw new ApiError(400, 'Không đọc được QR code');

  // 3. Parse payload từ QR code
  let payload;
  try {
    payload = JSON.parse(code.data);
  } catch (err) {
    throw new ApiError(400, 'QR code không đúng định dạng');
  }

  // 4. Lookup Card theo card_id hoặc public_key
  const card = await Card.findOne({ card_id: payload.card_id });
  if (!card || card.user_id !== payload.user_id) {
    throw new ApiError(404, 'Card không tồn tại hoặc không khớp');
  }
  if (card.status !== 'active') {
    throw new ApiError(403, 'Card bị vô hiệu');
  }

  // 5. Lấy user, tạo JWT và session
  const user = await User.findOne({ user_id: card.user_id });
  if (!user) throw new ApiError(404, 'User không tồn tại');

  const jwtPayload = {
    user_id: user.user_id,
    email:   user.email,
    role:    card.role,
    card_id: card.card_id
  };
  const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

  await createLoggingSession({
    user_id: user.user_id,
    role: card.role,
    token,
    card_id: card.card_id
  });

  return {
    access_token: token,
    user: { user_id: user.user_id, email: user.email, role: card.role }
  };
};


const sendVerifyEmailService = async (email) => {
  if (!email) throw new ApiError(400, 'Email is required');
  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpKey = `otp:${email}`;
  await redis.set(otpKey, otp, 'EX', 300);
  await sendVerificationEmail(email, otp);
  return { message: 'OTP sent to email' };
};


const verifyAccountService = async (email, otp) => {
  if (!email || !otp) throw new ApiError(400, 'Email and OTP are required');
  const otpKey = `otp:${email}`;
  const stored = await redis.get(otpKey);
  if (!stored) throw new ApiError(400, 'OTP has expired or is invalid');
  if (stored !== otp) throw new ApiError(400, 'Invalid OTP');

  await redis.del(otpKey);
  const user = await User.findOneAndUpdate({ email }, { email_verified: true }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  return { message: 'Email verified successfully' };
};

const updateUserService = async (user_id, updateData) => {
  const allowed = ['email', 'password'];
  const data = {};
  for (const field of allowed) if (updateData[field]) data[field] = updateData[field];
  if (data.password) data.password = await bcrypt.hash(data.password, 12);

  const user = await User.findOneAndUpdate({ user_id }, data, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found');
  user.password = undefined;
  return user;
};

const deleteUserService = async (user_id) => {
  const user = await User.findOneAndDelete({ user_id });
  if (!user) throw new ApiError(404, 'User not found');
  return { message: 'User deleted' };
};

module.exports = {
  getAllUsersService,
  getUserByIdService,
  createUserService,
  loginService,
  verifyAccountService,
  sendVerifyEmailService,
  updateUserService,
  deleteUserService,
  QRLoginService
}
