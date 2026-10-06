const { getNurseByUserIdService,createNurseProfileService,updateNurseProfileService,getAllNusersIsAvailableForMatchingService } = require('../services/nurseService');
const ApiError = require('../utils/apiError');

const getNurseByUserId = async (req, res, next) => {
try {
    const userId = req.params.id;
    const nurse = await getNurseByUserIdService(userId);

    if (!nurse) {
        return next(new ApiError(404, 'Nurse not found'));
    }

    res.status(200).json({
        success: true,
        data: nurse,
    });
} catch (error) {
    next(new ApiError(500, 'Internal Server Error'));
}
};

const createNurseProfile = async (req, res, next) => {
  try {
    const nurseProfile = await createNurseProfileService(req);

    res.status(201).json({
      success: true,
      data: nurseProfile,
    });
  } catch (error) {
    next(error); // Sử dụng middleware xử lý lỗi
  }
};

const updateNurseProfile = async (req, res, next) => {
  try {
    const userId = req.user.user_id; 
    const updatedProfile = await updateNurseProfileService(userId, req.body);
    res.status(200).json({ success: true, data: updatedProfile });
  } catch (error) {
    next(error);
  }
};

const getAvailableNurses = async (req, res, next) => {
 const nurses = await Nurse.find().limit(5);
console.log('First 5 nurses:', nurses)
};

const getAllNusersIsAvailableForMatching = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const data = await getAllNusersIsAvailableForMatchingService({ page: Number(page), limit: Number(limit) });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
    getNurseByUserId,
    createNurseProfile,
    updateNurseProfile,
    getAvailableNurses,
    getAllNusersIsAvailableForMatching
};