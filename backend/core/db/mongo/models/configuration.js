'use strict';

var mongoose = require('mongoose');

module.exports = mongoose.model('Configuration', new mongoose.Schema({
  domain_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain' },
  modules: [{
    name: { type: String, required: true },
    configurations: [{
      name: { type: String, required: true },
      value: mongoose.Schema.Types.Mixed
    }]
  }]
}, { collection: 'configurations' }));
