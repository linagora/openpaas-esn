'use strict';

var mongoose = require('mongoose');

var Address = new mongoose.Schema({
  post_box: {type: String},
  extended_address: {type: String},
  street: {type: String, required: true},
  city: {type: String, required: true},
  state: {type: String, required: true},
  zip_code: {type: String, required: true},
  country: {type: String, required: true}
}, {_id: false});

module.exports.Address = Address;
