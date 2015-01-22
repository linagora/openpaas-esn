'use strict';

var messagePermission = require('../../core/message/permission');
var messageModule = require('../../core/message');
var messageHelper = require('../../helpers/message');
var requestMiddleware = require('./request');

module.exports.canReplyTo = function(req, res, next) {
  var inReplyTo = req.body.inReplyTo;
  if (inReplyTo) {
    messageModule.get(inReplyTo._id, function(err, message) {
      if (err || !message) {
        return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'Can not find message to reply to'}});
      }

      messagePermission.canReply(message, req.user, function(err, result) {
        if (result) {
          return messageModule.typeSpecificReplyPermission(message, req.user, function(err, canReply) {
            if (err) {
              return res.json(500, {error: {code: 500, message: 'Server Error', details: err.message}});
            }
            if (!canReply) {
              return res.json(403, {error: {code: 403, message: 'Forbidden', details: 'You can not reply to this message'}});
            }
            return next();
          });
        }
        return res.json(403, {error: {code: 403, message: 'Forbidden', details: 'You can not reply to this message'}});
      });
    });
  } else {
    next();
  }
};

module.exports.checkTargets = function(req, res, next) {
  var inReplyTo = req.body.inReplyTo;
  if (inReplyTo) {
    return next();
  }
  return requestMiddleware.assertRequestElementArrayAndNotEmpty('message_targets')(req, res, next);
};

module.exports.checkMessageModel = function(req, res, next) {
  var inReplyTo = req.body.inReplyTo;
  if (inReplyTo) {
    return next();
  }
  var messageModel = messageHelper.postToModelMessage(req.body, req.user);
  if (!messageModel.objectType) {
    return res.json(400, {error: {code: 400, message: 'Bad Request', details: 'ObjectType is required for messages.'}});
  }
  messageModule.specificModelCheckForObjectType(messageModel.objectType, messageModel, req.message_targets, function(err) {
    if (err) {
      return res.json(400, {error: {code: 400, message: 'Bad Request', details: err.message}});
    }
    next();
  });
};
