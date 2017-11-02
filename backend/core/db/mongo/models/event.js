'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
  uuid: { type: String, unique: true },
  name: String,
  objectType: String,
  payload: Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
  context: {
    userId: { type: Schema.Types.ObjectId, ref: 'User' }
  }
});

module.exports = mongoose.model('Event', eventSchema);
