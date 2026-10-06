const mongoose = require('mongoose');

const systemSchema = new mongoose.Schema({
  logoutAllUsersAt: Date,
  currentSystemTime: {
    type: Date,
    default: Date.now
  }
});

const System = mongoose.model('System', systemSchema);
module.exports = System;