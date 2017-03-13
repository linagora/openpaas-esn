'use strict';

var mongoose = require('mongoose');

var moduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  configurations: [{
    name: { type: String, required: true },
    value: mongoose.Schema.Types.Mixed,
    _id: false
  }]
}, { _id: false, minimize: false });

var configurationSchema = new mongoose.Schema({
  domain_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  modules: [moduleSchema]
}, { collection: 'configurations', minimize: false });

module.exports = mongoose.model('Configuration', configurationSchema);
