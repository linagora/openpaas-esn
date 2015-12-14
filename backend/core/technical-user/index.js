'use strict';

var mongoose = require('mongoose');
var TechnicalUser = mongoose.model('TechnicalUser');
var authToken = require('../auth/token');

var TYPE = 'technical';
module.exports.TYPE = TYPE;

function findByType(type, callback) {
  TechnicalUser.find({type: type}, callback);
}
module.exports.findByType = findByType;

function findByTypeAndDomain(type, domain, callback) {
  TechnicalUser.find({type: type, domain: domain}, callback);
}
module.exports.findByTypeAndDomain = findByTypeAndDomain;

function get(id, callback) {
  TechnicalUser.findOne({_id: id}, callback);
}
module.exports.get = get;

function list(callback) {
  TechnicalUser.find(callback);
}
module.exports.list = list;

function getNewToken(technicalUser, ttl, callback) {
  authToken.getNewToken({ttl: ttl, user: technicalUser._id, user_type: TYPE}, callback);
}
module.exports.getNewToken = getNewToken;
