const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); 

const nurseSchema = new mongoose.Schema({
  nurse_id: {
    type: String,
    required: true,
    unique: true,
   default: uuidv4
  },
user_id: {
  type: String,
  ref: 'User', 
  required: true
},
card_id: {
    type: String,
    ref: 'Card', // Đảm bảo ref đúng tới CardModel nếu nó là ID từ Card
    required: true,
    unique: true,
    description: 'ID thẻ QR (tạo từ student_id và user_id, áp dụng cho nurse).'
  },
   student_id: {
    type: String, // Tham chiếu đến User
    ref: 'User',
    required: true,
    unique: true
  },
  school: {
    type: String,
    required: true
  },
  year_of_study: {
    type: Number,
    required: true
  },
  poseidonHash: {
    type: String,
    required: true
  },
  test_score: {
    type: Number,
    min: 0,
    max: 10,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  major: {
    type: String,
    required: true
  },
  isAvailableForMatching: {
    type: Boolean,
    default: true
  },
  matchingResetAt: {
    type: Date
  },
  lastTestAt: {
    type: Date
  },
  isLockedForToday: {
    type: Boolean,
    default: false
  },
  dailyScoreHistory: [{
    timestamp: {
      type: Date,
      required: true
    },
    score: {
      type: Number,
      min: 0,
      max: 10,
      required: true
    }
  }],
  reviews: [{
    elderly_id: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String
    },
    timestamp: {
      type: Date,
      required: true
    }
  }],
  level: {
    type: String,
    enum: ['basic', 'standard', 'premium'],
    required: true
  },
    experience_years: {
    type: Number
  },
  specializations: {
    type: [String]
  },
  certifications: {
    type: [String]
  },
   gender: {
    type: Boolean
  },
  date_of_birth: {
    type: Date
  },
  university: {
    type: String
  },
  faculty: {
    type: String
  },
  degree_level: {
    type: String
  },
  enrollment_year: {
    type: Number
  },
  avatar_url: { // URL đã băm
    type: String
  },
  address: {
    type: String
  },
  average_rating: {
    type: Number,
    min: 0,
    max: 5
  },
  committed_hours_per_week: {
    type: Number
  },
  special_skills: {
    type: [String]
  },
  quality_supervision_frequency: {
    type: String,
    enum: ["quarterly", "monthly", "weekly"]
  },
  response_time_commitment: {
    type: String,
    enum: ["24h", "12h", "4h"]
  },
  availability: [{ // Thời gian rảnh
    start_time: { type: Date },
    end_time: { type: Date }
  }],
   gpa: {
    type: Number,
    min: 0,
    max: 4.0
  },
  total_bookings: {
    type: Number,
    min: 0
  },
  total_feedback_count: {
    type: Number,
    min: 0
  },
  ratio_feedbacks: {
    type: Number,
    min: 0
  },
  certificates: { 
    type: [String]
  },
    evm_address: {
    type: String,
    unique: true,
    sparse: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    nullable: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });


const Nurse = mongoose.model('Nurse', nurseSchema);

module.exports = Nurse;