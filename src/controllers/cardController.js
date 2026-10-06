const {
  createCardService,
  getCardByCardIdService,
  getCardByUserIdService,
  updateCardService,
  deleteCardService,
  listCardsService
} = require('../services/cardService');

const createCard = async (req, res, next) => {
  try {
    const { user_id, role } = req.user;
    const { student_id } = req.body;
    const card = await createCardService({ user_id, student_id, role });
    res.status(201).json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
};

 // Danh sách card có phân trang (admin)
const listCards = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await listCardsService({ page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getCardByCardId = async (req, res, next) => {
  try {
    const card = await getCardByCardIdService(req.params.card_id);
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

const getCardByUserId = async (req, res, next) => {
  try {
    const card = await getCardByUserIdService(req.params.user_id);
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

const updateCard = async (req, res, next) => {
  try {
    const card = await updateCardService(req.params.card_id, req.body);
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

const deleteCard = async (req, res, next) => {
  try {
    const result = await deleteCardService(req.params.card_id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCard,
  getCardByCardId,
  getCardByUserId,
  updateCard,
  deleteCard,
  listCards
};