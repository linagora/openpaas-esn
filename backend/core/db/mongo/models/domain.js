'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DomainSchema = new Schema({
  name: {type: String, required: true},
  company_name: {type: String, require: true},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  schemaVersion: {type: Number, default: 1}
});

module.exports = mongoose.model('Domain', DomainSchema);
