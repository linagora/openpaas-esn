'use strict';

var mongoose = require('mongoose');

var AddressBookSchema = new mongoose.Schema({
  name: {type: String, required: true, trim: true},
  schemaVersion: {type: Number, default: 1},
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  creator: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}
});

module.exports = mongoose.model('AddressBook', AddressBookSchema);
