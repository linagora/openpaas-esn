'use strict';

var userHelper = require('../../helpers/user');
var userModule = require('../user');

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
  userHelper.isInternal(user, function(err, isInternal) {
    if (err) {
      return callback(err);
    }
    if (isInternal) {
      return callback(null);
    }
    var compliantCompany = message.recipients.some(function(companyTuple) {
      var result = false;
      userModule.belongsToCompany(user, companyTuple.id, function(err, belongs) {
        result = !err && belongs;
      });
      return result;
    });
    return callback(compliantCompany);
  });
};
