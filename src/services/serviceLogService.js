const ServiceLog = require("../models/ServiceLogModel");
const ApiError = require("../utils/apiError");
const Nurse = require("../models/NurseModel");
const Elderly = require("../models/ElderiesModel");

// 1. Tạo Service Log
const createServiceLogService = async (logData,nurseUserId) => {
  // Validate thời gian
  if (logData.end_time <= logData.start_time) {
    throw new ApiError(400, "end_time phải sau start_time");
  }

  // 1. Tìm nurse dựa trên user_id của nurse từ JWT
  const nurse = await Nurse.findOne({ user_id: nurseUserId });
  if (!nurse) {
    throw new ApiError(404, "Nurse không tồn tại");
  }

   // 2. Tìm elderly dựa trên elderly_id từ request body
  const elderlyExists = await Elderly.findOne({ elderly_id: logData.elderly_id });
  if (!elderlyExists) {
    throw new ApiError(404, "Elderly không tồn tại");
  }

  
 
  // 3. Tạo log với nurse_id lấy từ nurse document
  const log = await ServiceLog.create({
    ...logData,
    nurse_id: nurse.nurse_id // Sử dụng nurse_id từ nurse document
  });

  return log;
};

// 2. Tính tổng giờ chăm sóc (cho 1 log cụ thể)
const calculateCareHoursService = (start_time, end_time) => {
  const durationMs = end_time - start_time;
  return (durationMs / (1000 * 60 * 60)).toFixed(2); // Chuyển sang giờ
};

// 3. Lấy lịch sử log theo filter (nurse_id hoặc elderly_id)
const getServiceLogsService = async (filter) => {

  const logs = await ServiceLog.find(filter).sort({ start_time: -1 }).lean();


  return logs.map(log => ({
    ...log,
    total_hours: calculateCareHoursService(log.start_time, log.end_time)
  }));
};

// 4. Cập nhật Service Log
const updateServiceLogService = async (logId, updateData) => {
  if (updateData.end_time <= updateData.start_time) {
    throw new ApiError(400, "end_time phải sau start_time");
  }

  const log = await ServiceLog.findByIdAndUpdate(logId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!log) throw new ApiError(404, "Service log không tồn tại");
  return log;
};

module.exports = {
  createServiceLogService,
  getServiceLogsService,
  updateServiceLogService,
};