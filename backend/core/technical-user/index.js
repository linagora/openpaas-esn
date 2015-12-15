'use strict';

var mongoose = require('mongoose');
var TechnicalUser = mongoose.model('TechnicalUser');
var TYPE = 'technical';

module.exports.TYPE = TYPE;

function findByType(type, callback) {
  TechnicalUser.find({type: type}, callback);
}
module.exports.findByType = findByType;

function get(id, callback) {
  TechnicalUser.findOne({_id: id}, callback);
}
module.exports.get = get;

function list(callback) {
  TechnicalUser.find(callback);
}
module.exports.list = list;
