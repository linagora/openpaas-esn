'use strict';

var mongoose = require('../../../../core').db.mongo.mongoose();
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  email: {type: String, required: true, unique: true},
  firstname: {type: String},
  lastname: {type: String},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  schemaVersion: {type: Number, default: 1}
});

module.exports = mongoose.model('User', UserSchema);
