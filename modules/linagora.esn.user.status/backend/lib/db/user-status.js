'use strict';

const CONSTANTS = require('../constants');

module.exports = function(dependencies) {

  const mongoose = dependencies('db').mongo.mongoose;
  const ObjectId = mongoose.Schema.ObjectId;

  const UserStatusSchema = new mongoose.Schema({
    _id: {type: ObjectId, ref: 'User'},
    current_status: {type: String, default: CONSTANTS.STATUS.DEFAULT},
    previous_status: {type: String, default: CONSTANTS.STATUS.DEFAULT},
    delay: {type: Number, default: 0},
    timestamps: {
      last_update: {type: Date, default: Date.now}
    },
    schemaVersion: {type: Number, default: 1}
  });

  return mongoose.model('UserStatus', UserStatusSchema);
};
