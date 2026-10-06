// services/elderlyService.js
const  Elderly  = require('../models/ElderiesModel');      
const {User} = require('../models/UserModel');
const ApiError = require('../utils/apiError');
const {createCardService} = require('../services/cardService');

const createElderlyProfileService = async (req) => {
  const {
    full_name,
    gender,
    date_of_birth,
    permanent_address,
    current_address,
    insurance_number,
    phone_number,
    avatar_url
  } = req.body;

  // 1. Chỉ elderly mới được tạo profile
  if (req.user.role !== 'elderly') {
    throw new ApiError(403, 'Only elderly can create profiles');
  }

  // 2. Kiểm tra user tồn tại & đã verify email
  const user = await User.findOne({ user_id: req.user.user_id });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (!user.email_verified) {
    throw new ApiError(403, 'Email must be verified before creating profile');
  }

  // 3. Kiểm tra profile đã tồn tại chưa
  const exists = await Elderly.findOne({ user_id: req.user.user_id });
  if (exists) {
    throw new ApiError(400, 'Profile already exists');
  }

  // 4. Tạo card cho elderly
  const card = await createCardService({
    user_id: req.user.user_id,
    role: 'elderly'
  });

  // 5. Tạo profile mới
  const profile = new Elderly({
    user_id: req.user.user_id,
    // Cập nhật các trường đặc thù của Elderly theo schema
    full_name,
    gender,
    date_of_birth,
    permanent_address,
    current_address,
    insurance_number,
    phone_number,
    avatar_url,
    // Copy các trường card vào để pipeline merge
    public_key:   card.public_key,
    private_key_encrypted: card.private_key_encrypted,
    qr_code_data: card.qr_code_data,
    email:        user.email,
    email_verified: user.email_verified
  });

  await profile.save();
  return profile;
};

const getElderlyByUserIdService = async (user_id) => {
  const elderly = await Elderly.findOne({ user_id });
  if (!elderly) throw new ApiError(404, 'Elderly not found');
  return elderly;
};

const listElderlyService = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [elderlies, total] = await Promise.all([
    Elderly.find().skip(skip).limit(limit),
    Elderly.countDocuments()
  ]);
  return { elderlies, total, page, limit };
};

const updateElderlyProfileService = async (userId, updateData) => {
  const profile = await Elderly.findOneAndUpdate(
    { user_id: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!profile) {
    throw new ApiError(404, 'Elderly profile not found.');
  }
  return profile;
};

module.exports = {
  createElderlyProfileService,
  getElderlyByUserIdService,
  listElderlyService,
  updateElderlyProfileService
};
