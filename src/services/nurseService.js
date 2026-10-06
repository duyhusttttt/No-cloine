const Nurse = require('../models/NurseModel');
const {User} = require('../models/UserModel');
const ApiError = require('../utils/apiError');
const {createCardService} = require('../services/cardService');

const getNurseByUserIdService = async (userId) => {
  const nurse = await Nurse.findOne({ user_id: userId });
  if (!nurse) throw new ApiError(404, 'Nurse not found');
  return nurse;
};

const createNurseProfileService = async (req) => {
  const {
    level,
    experience_years,
    specializations,
    certifications,
    location,
    school,
    year_of_study,
    poseidonHash,
    test_score,
    class: nurseClass,
    course,
    major
  } = req.body;

  // Kiểm tra role của người dùng
  if (req.user.role !== 'nurse') {
    throw new ApiError(403, 'Only nurses can create profiles');
  }

  // Lấy user từ DB để kiểm tra email_verified
  const user = await User.findOne({ user_id: req.user.user_id });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (!user.email_verified) {
    throw new ApiError(403, 'Email must be verified before creating profile');
  }

  // Kiểm tra xem hồ sơ đã tồn tại chưa
  const existingProfile = await Nurse.findOne({ user_id: req.user.user_id });
  if (existingProfile) {
    throw new ApiError(400, 'Profile already exists');
  }

   // Tạo card tự động (card_id sẽ tự sinh trong service)
  const card = await createCardService({
    user_id: req.user.user_id,
    student_id: user.student_id,
    role: req.user.role
  });

  // Tạo hồ sơ mới
  const nurseProfile = new Nurse({
    user_id: req.user.user_id,
    student_id: user.student_id,
    card_id: card.card_id,
    level,
    experience_years,
    specializations,
    certifications,
    location,
    school,
    year_of_study,
    poseidonHash,
    test_score,
    class: nurseClass,
    course,
    major,
    profile_completed: true
  });

  await nurseProfile.save();

 
  return nurseProfile;
};

const updateNurseProfileService = async (userId, updateData) => {
  // updateData có thể chứa evm_address và các trường khác
  const profile = await Nurse.findOneAndUpdate(
    { user_id: userId }, // Tìm profile bằng user_id (từ JWT)
    { $set: updateData }, // Cập nhật các trường trong updateData
    { new: true, runValidators: true }
  );
  if (!profile) {
    throw new ApiError(404, 'Nurse profile not found.');
  }
  return profile;
};



const getAllNusersIsAvailableForMatchingService = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    Nurse.find({isAvailableForMatching: true}).skip(skip).limit(limit).select('-password'),
    Nurse.countDocuments({ isAvailableForMatching: true })
  ]);
  return { users, total, page, limit };
};
module.exports = {
  getNurseByUserIdService,
  createNurseProfileService,
  updateNurseProfileService,
   getAllNusersIsAvailableForMatchingService
};