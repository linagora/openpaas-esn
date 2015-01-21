'use strict';

var async = require('async');
var permissionHelpers = require('../../helpers/permission');
var messagePermission = require('../../core/message/permission');

module.exports.checkModel = function(messageModel, messageTargets, callback) {
  if (!messageModel.inReplyTo) {
    if (!messageTargets || messageTargets.length !== 1) {
      return callback(new Error('An organizational message can only be posted to a single collaboration.'));
    }
  }

  if (!messageModel.recipients || messageModel.recipients.length === 0) {
    return callback(new Error('An organizational message must have a non empty array of recipients.'));
  }

  var allCompanies = messageModel.recipients.every(function(item) {
    return item && item.objectType && item.objectType === 'company';
  });
  if (!allCompanies) {
    return callback(new Error('For now, only companies are allowed as organizational messages.'));
  }

  return callback(null);
};

module.exports.checkReplyPermission = function(message, user, callback) {
  return permissionHelpers.checkUserCompany(message.recipients, user, callback);
};

module.exports.filterReadableResponses = function(message, user, callback) {
  if (!user) {
    return callback(new Error('User is required'));
  }
  if (!Array.isArray(message.responses) || message.responses.length === 0) {
    return callback(null, message);
  }
  async.filter(message.responses, function(response, callback) {
    messagePermission.canReadResponse(response, {objectType: 'user', id: user._id}, function(err, canRead) {
      return callback(!err && canRead);
    });
  }, function(responsesReadable) {
    message.responses = responsesReadable;
    return callback(null, message);
  });
};
