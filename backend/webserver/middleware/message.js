'use strict';

var async = require('async');

var messagePermission = require('../../core/message/permission');
var collaborationPermission = require('../../core/collaboration/permission');
var collaborationModule = require('../../core/collaboration');
var tupleHelper = require('../../core/tuple');
var messageModule = require('../../core/message');
var messageHelper = require('../../helpers/message');
var requestMiddleware = require('./request');
var logger = require('../../core/logger');

module.exports.canReplyTo = function(req, res, next) {
  var inReplyTo = req.body.inReplyTo;
  if (inReplyTo) {
    messageModule.get(inReplyTo._id, function(err, message) {
      if (err || !message) {
        return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Can not find message to reply to'}});
      }

      messagePermission.canReply(message, req.user, function(err, result) {
        if (result) {
          return messageModule.typeSpecificReplyPermission(message, req.user, req.body.object, function(err, canReply) {
            if (err) {
              return res.status(500).json({error: {code: 500, message: 'Server Error', details: err.message}});
            }
            if (!canReply) {
              return res.status(403).json({error: {code: 403, message: 'Forbidden', details: 'You can not reply to this message'}});
            }
            return next();
          });
        }
        return res.status(403).json({error: {code: 403, message: 'Forbidden', details: 'You can not reply to this message'}});
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
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'ObjectType is required for messages.'}});
  }
  messageModule.specificModelCheckForObjectType(messageModel.objectType, messageModel, req.message_targets, function(err) {
    if (err) {
      return res.status(400).json({error: {code: 400, message: 'Bad Request', details: err.message}});
    }
    next();
  });
};

module.exports.canShareFrom = function(req, res, next) {
  var resource = req.body.resource;

  if (!tupleHelper.isTupleOfType('activitystream', resource)) {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Invalid tuple'}});
  }

  collaborationModule.findCollaborationFromActivityStreamID(resource.id, function(err, collaboration) {
    if (err) {
      logger.error('Error while searching collaboration to share message from (objectType:%s, id: %s)', resource.objectType, resource.id, err);
      return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Server Error while searching collaboration: ' + err.message}});
    }

    if (!collaboration || collaboration.length === 0) {
      return res.status(404).json({error: {code: 404, message: 'Not Found', details: 'Collaboration not found (objectType:' + resource.objectType + ', id: ' + resource.id + ')'}});
    }

    collaborationPermission.canRead(collaboration[0], {objectType: 'user', id: req.user.id}, function(err, read) {
      if (err) {
        logger.error('Error while checking read rights on collaboration (objectType:%s, id: %s)', resource.objectType, resource.id, err);
        return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Server Error while checking read rights: ' + err.message}});
      }

      if (!read) {
        return res.status(403).json({error: {code: 403, message: 'Forbidden', details: 'Not enough rights to read messages from collaboration'}});
      }

      next();
    });
  });
};

module.exports.canShareTo = function(req, res, next) {

  var targets = req.body.target;
  if (!targets || targets && !targets.length) {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Target is required'}});
  }

  async.filter(targets,
    function(tuple, callback) {
      collaborationModule.findCollaborationFromActivityStreamID(tuple.id, function(err, collaboration) {
        if (err || !collaboration || collaboration.length === 0) {
          return callback(err, false);
        }

        collaborationPermission.canWrite(collaboration[0], {objectType: 'user', id: req.user.id}, callback);
      });
    },
    function(err, results) {

      if (!results || results.length === 0) {
        return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Can not find any writable target in request'}});
      }
      req.body.target = results;
      next();
    });
};

function canLike(req, res, next) {
  const link = req.link;

  logger.debug('Check the message like link', link);

  if (link.target.objectType !== 'esn.message') {
    return next();
  }

  if (!req.user._id.equals(link.source.id)) {
    return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'You can not like a message for someone else'}});
  }

  messageModule.findByIds([link.target.id], (err, messages) => {
    if (err || !messages.length) {
      logger.error('Can not find the message to like', err);

      return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Can not find message to like'}});
    }

    const message = messages[0];

    messageModule.like.isMessageLikedByUser(message, req.user)
      .then(result => {
        if (result) {
          return res.status(400).json({error: {code: 400, message: 'Bad Request', details: 'Message is already liked by user'}});
        }

        messagePermission.canLike(message, link.source, (err, result) => {
          if (err) {
            logger.error('Error while checking like permission');

            return res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Can not check if user can like message'}});
          }

          req.linkable = result;
          next();
        });

      }, err => {
        logger.error('Error while checking if message is already liked by user', err);
        res.status(500).json({error: {code: 500, message: 'Server Error', details: 'Can not check if user already liked the message'}});
      });
  });
}
module.exports.canLike = canLike;
