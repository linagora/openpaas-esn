'use strict';

const mongoose = require('mongoose');
const DEFAULT_TTL = 60000;

const authTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true, default: new Date(new Date().getTime() + DEFAULT_TTL) },
  data: mongoose.Schema.Types.Mixed
});

authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AuthToken', authTokenSchema);
