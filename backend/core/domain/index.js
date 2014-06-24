'use strict';

var mongoose = require('mongoose');
var Domain = mongoose.model('Domain');

function load(id, callback) {
  if (!id) {
    return callback(new Error('Domain id is required'));
  }
  return Domain.findOne({_id: id}, callback);
}
module.exports.load = load;
