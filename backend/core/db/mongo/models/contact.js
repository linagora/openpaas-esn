'use strict';

var mongoose = require('mongoose');
var trim = require('trim');


var ContactSchema = new mongoose.Schema({
  owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  addressbooks: {type: [mongoose.Schema.Types.ObjectId], ref: 'AddressBook'},
  emails: {type: [String], required: true},
  given_name: {type: String},
  timestamps: {
    creation: {type: Date, default: Date.now}
  }
});

ContactSchema.pre('save', function(next) {
  var contact = this;

  contact.emails = contact.emails.map(function(email) {
    return trim(email).toLowerCase();
  });

  return next();
});


module.exports = mongoose.model('Contact', ContactSchema);
