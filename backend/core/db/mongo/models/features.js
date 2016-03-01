'use strict';

var mongoose = require('mongoose');

module.exports = mongoose.model('Features', new mongoose.Schema({
  domain_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', required: true },
  modules: [{
    name: { type: String, required: true },
    features: [{
      name: { type: String, required: true },
      value: mongoose.Schema.Types.Mixed
    }]
  }]
}, { collection: 'features' }));
