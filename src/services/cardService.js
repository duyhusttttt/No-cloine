// services/cardService.js
const Card = require('../models/CardModel');
const ApiError = require('../utils/apiError');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const elliptic = require('elliptic');
const EC = new elliptic.ec('secp256k1');
const QRCode = require('qrcode');             // 1. import qrcode

function hashStudentId(student_id) {
  return crypto.createHash('sha256').update(student_id).digest('hex');
}
function generateECCKeyPair() {
  const key = EC.genKeyPair();
  return { publicKey: key.getPublic('hex'), privateKey: key.getPrivate('hex') };
}
function encryptPrivateKey(privateKey) {
  return Buffer.from(privateKey).toString('base64');
}

// 2. Service tạo card và QR image
const createCardService = async ({ user_id, student_id, role }) => {
  try {
    const card_id = uuidv4();
    const { publicKey, privateKey } = generateECCKeyPair();
    const private_key_encrypted = encryptPrivateKey(privateKey);

    let hashed_student_id = null;
    if (role === 'nurse' && student_id) {
      hashed_student_id = hashStudentId(student_id);
    }

    // Chuẩn bị nội dung JSON cho QR
    const payload = { card_id, user_id, public_key: publicKey };
    const jsonString = JSON.stringify(payload);

    // Chuyển JSON thành hình data URI QR code
    const qr_code_data = await QRCode.toDataURL(jsonString);

    const card = await Card.create({
      card_id,
      hashed_student_id,
      user_id,
      role,
      public_key: publicKey,
      private_key_encrypted,
      qr_code_data
    });
    return card;
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'Card ID already exists');
    }
    throw new ApiError(500, 'Internal server error');
  }
};

// 3. Service list/paginate cards
const listCardsService = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [cards, total] = await Promise.all([
    Card.find().skip(skip).limit(limit),
    Card.countDocuments()
  ]);
  return { cards, total, page, limit };
};

const getCardByCardIdService = async (card_id) => {
  const card = await Card.findOne({ card_id });
  if (!card) throw new ApiError(404, 'Card not found');
  return card;
};

const getCardByUserIdService = async (user_id) => {
  const card = await Card.findOne({ user_id });
  if (!card) throw new ApiError(404, 'Card not found');
  return card;
};

const updateCardService = async (card_id, updateData) => {
  const card = await Card.findOneAndUpdate({ card_id }, updateData, { new: true });
  if (!card) throw new ApiError(404, 'Card not found');
  return card;
};

const deleteCardService = async (card_id) => {
  const card = await Card.findOneAndDelete({ card_id });
  if (!card) throw new ApiError(404, 'Card not found');
  return { message: 'Card deleted' };
};

module.exports = {
  createCardService,
  listCardsService,
  getCardByCardIdService,
  getCardByUserIdService,
  updateCardService,
  deleteCardService
};
