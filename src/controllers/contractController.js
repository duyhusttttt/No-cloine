const ApiError = require('../utils/apiError');
const {
  listContractsService,
  getContractByIdService,
  updateContractStatusService,
  deleteContractService,
  fillContractService,
} = require('../services/contractService');

const listContracts = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await listContractsService({ page, limit, status });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getContractById = async (req, res, next) => {
  try {
    const contract = await getContractByIdService(req.params.id);
    res.status(200).json({ success: true, data: contract });
  } catch (err) {
    next(err);
  }
};

const updateContractStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const contract = await updateContractStatusService(req.params.id, status);
    res.status(200).json({ success: true, data: contract });
  } catch (err) {
    next(err);
  }
};

const deleteContract = async (req, res, next) => {
  try {
    const result = await deleteContractService(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};

async function fillContract(req, res, next) {
  try {
    const updated = await fillContractService(
      req.params.id,
      req.body,
      req.user.user_id
    );
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listContracts,
  getContractById,
  updateContractStatus,
  deleteContract,
  fillContract
};