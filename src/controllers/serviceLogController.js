const { createServiceLogService,
  getServiceLogsService,
  updateServiceLogService,
} = require("../services/serviceLogService");
const ApiError = require("../utils/apiError");
const Nurse = require("../models/NurseModel");
const Elderly = require("../models/ElderiesModel");

// Tạo log (Dành cho nurse)
const createLog = async (req, res, next) => {
  try {
    const log = await createServiceLogService(
      req.body,           // Chứa elderly_id và các thông tin khác
      req.user.user_id    // user_id của nurse từ JWT
    );
    res.status(201).json(log);
  } catch (err) {
    next(new ApiError(err.statusCode || 500, err.message));
  }
};

const getLogs = async (req, res, next) => {
  try {
    const filter = {};

    if (req.user.role === 'nurse') {
      // Tìm nurse document để lấy đúng nurse_id
      const nurse = await Nurse.findOne({ user_id: req.user.user_id }).select('nurse_id');
      if (!nurse) throw new ApiError(404, 'Nurse profile not found');
      filter.nurse_id = nurse.nurse_id;
    }

    if (req.user.role === 'elderly') {
      // Tìm elderly document để lấy đúng _id
      const elderly = await Elderly.findOne({ user_id: req.user.user_id }).select('_id');
      if (!elderly) throw new ApiError(404, 'Elderly profile not found');
      filter.elderly_id = elderly._id.toString();
    }

    if (req.user.role === 'admin') {
      // Admin có thể truyền thẳng id tương ứng
      if (req.query.nurse_id)   filter.nurse_id   = req.query.nurse_id;
      if (req.query.elderly_id) filter.elderly_id = req.query.elderly_id;
    }

    const logs = await getServiceLogsService(filter);
    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

const updateLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedLog = await updateServiceLogService(id, req.body);
    res.status(200).json({ success: true, data: updatedLog });
  } catch (err) {
    next(new ApiError(err.statusCode || 500, err.message));
  }
};



module.exports = {
  createLog,
  getLogs,
  updateLog
};