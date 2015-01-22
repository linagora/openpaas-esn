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

module.exports.checkReplyPermission = function(message, user, replyData, callback) {
  if (replyData.objectType !== 'organizational') {
    return callback(new Error('Replies to an organizational message must be an organizational message.'));
  }
  permissionHelpers.checkUserCompany(message.recipients, user, function(err) {
    if (err) {
      return callback(err);
    }
    if (replyData.data.recipients) {
      var unknownRecipients = replyData.data.recipients.filter(function(replyRecipient) {
        var isInParentMsgRecipients = message.recipients.some(function(parentMsgRecipient) {
          return parentMsgRecipient.objectType === replyRecipient.objectType && parentMsgRecipient.id === replyRecipient.id;
        });
        return !isInParentMsgRecipients;
      });
      if (unknownRecipients.length > 0) {
        return callback(new Error('Replies recipients are not inherited from parent message.'));
      }
      return callback(null, true);
    }
  });
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
