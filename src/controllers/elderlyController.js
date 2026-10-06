const {createElderlyProfileService,getElderlyByUserIdService,listElderlyService,updateElderlyProfileService} = require('../services/elderlyService');
const ApiError = require('../utils/apiError');

const createElderlyProfile = async (req, res, next) => {
  try {
    const elderlyProfile = await createElderlyProfileService(req);

    res.status(201).json({
      success: true,
      data: elderlyProfile,
    });
  } catch (error) {
    next(error); // Sử dụng middleware xử lý lỗi
  }
};

const getElderlyByUserId = async (req, res, next) => {
  try {
    const elderly = await getElderlyByUserIdService(req.params.user_id);
    res.status(200).json({ success: true, data: elderly });
  } catch (error) {
    next(error);
  }
};


const listElderly = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await listElderlyService({ page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const updateElderlyProfile = async (req, res, next) => {
  try {
   
    const userId = req.user.user_id; 
    const updatedProfile = await updateElderlyProfileService(userId, req.body);
    res.status(200).json({ success: true, data: updatedProfile });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createElderlyProfile,
  getElderlyByUserId,
  listElderly,
  updateElderlyProfile
};