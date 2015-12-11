'use strict';

var mongoose = require('mongoose');
var Mixed = mongoose.Schema.Types.Mixed;

var TechnicalUserSchema = new mongoose.Schema({
  name: {type: String, trim: true},
  description: {type: String},
  type: {type: String, trim: true},
  domain: {type: mongoose.Schema.Types.ObjectId, ref: 'Domain', required: true},
  data: {type: Mixed},
  schemaVersion: {type: Number, default: 1}
}, {collection: 'technicalusers'});

module.exports = mongoose.model('TechnicalUser', TechnicalUserSchema);
