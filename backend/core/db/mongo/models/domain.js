'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DomainSchema = new Schema({
  name: {type: String},
  company_name: {type: String},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  schemaVersion: {type: Number, default: 1}
});

module.exports = mongoose.model('Domain', DomainSchema);
