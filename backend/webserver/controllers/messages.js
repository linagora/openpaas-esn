'use strict';

var messageModule = require('../../core/message'),
    emailModule = require('../../core/message/email'),
    postToModel = require(__dirname + '/../../helpers/message').postToModelMessage,
    publishCommentActivityHelper = require('../../helpers/message').publishCommentActivity,
    messageSharesToTimelineTarget = require('../../helpers/message').messageSharesToTimelineTarget,
    publishMessageEvents = require('../../helpers/message').publishMessageEvents,
    logger = require('../../core/logger'),
    localpubsub = require('../../core/pubsub').local,
    globalpubsub = require('../../core/pubsub').global;

function createNewMessage(message, req, res) {
  function finishMessageResponse(err, savedMessage) {
    if (err) {
      logger.warn('Can not set attachment references', err);
    }

    publishMessageEvents(savedMessage, req.body.targets, req.user);
    res.send(201, { _id: savedMessage._id });
  }

  messageModule.getInstance(message.objectType, message).save(function(err, saved) {
    if (err) {
      var errorData = { error: { status: 500, message: 'Server Error', details: 'Cannot create message . ' + err.message }};
      return res.send(500, errorData);
    }

    if (!saved) {
      return res.send(404);
    }

    if (message.attachments && message.attachments.length > 0) {
      var attachCallback = function(err) { finishMessageResponse(err, saved); };
      return messageModule.setAttachmentsReferences(saved, attachCallback);
    } else {
      finishMessageResponse(null, saved);
    }
  });
}

function commentMessage(message, inReplyTo, req, res) {

  var publishCommentActivity = function(parentMessage, childMessage) {
    publishCommentActivityHelper(req.user, inReplyTo, parentMessage, childMessage);
  };

  var comment;
  if (!inReplyTo._id) {
    return res.send(400, { error: { status: 400, message: 'Bad parameter', details: 'Missing inReplyTo _id in body'}});
  }
  try {
    comment = messageModule.getInstance(message.objectType, message);
  } catch (e) {
    return res.send(400, { error: { status: 400, message: 'Bad parameter', details: 'Unknown message type ' + message.objectType}});
  }
  messageModule.addNewComment(comment, inReplyTo, function(err, childMessage, parentMessage) {
    if (err) {
      return res.send(
        500,
        { error: { status: 500, message: 'Server Error', details: 'Cannot add commment. ' + err.message }});
    }

    if (message.attachments && message.attachments.length > 0) {
      return messageModule.setAttachmentsReferences(message, function(err) {
        if (err) {
          logger.warn('Can not set attachment references', err);
        }
        publishCommentActivity(parentMessage, childMessage);
        return res.send(201, { _id: childMessage._id, parentId: parentMessage._id });
      });
    } else {
      publishCommentActivity(parentMessage, childMessage);
      return res.send(201, { _id: childMessage._id, parentId: parentMessage._id });
    }
  });
}

function create(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return res.send(500, { error: { status: 500, message: 'Server Error', details: 'User is not set.'}});
  }

  if (!req.body) {
    return res.send(400, 'Missing message in body');
  }

  if (req.message_targets) {
    req.body.targets = req.message_targets;
  }

  var message = postToModel(req.body, req.user);

  if (req.body.inReplyTo) {
    commentMessage(message, req.body.inReplyTo, req, res);
  } else {
    createNewMessage(message, req, res);
  }
}

function get(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return res.send(500, { error: { status: 500, message: 'Server Error', details: 'User can not be set.'}});
  }

  if (!req.query || !req.query.ids) {
    return res.send(400, 'Missing ids in query');
  }

  messageModule.findByIds(req.query.ids, function(err, result) {
    if (err) {
      return res.send(
        500,
        { error: { status: 500, message: 'Server Error', details: 'Cannot get messages. ' + err.message}});
    }

    var foundIds = result.map(function(message) {
      return message._id.toString();
    });
    req.query.ids.filter(function(id) {
      return foundIds.indexOf(id) < 0;
    }).forEach(function(id) {
      result.push({
        error: {
          status: 404,
          message: 'Not Found',
          details: 'The message ' + id + ' can not be found'
        }
      });
    });

    return res.send(200, result);
  });
}

function getOne(req, res) {
  if (!req.param('uuid')) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'Message ID is required'}});
  }

  var uuid = req.param('uuid');

  messageModule.get(uuid, function(err, result) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Server Error', details: 'Cannot get message. ' + err.message}});
    }

    if (!result) {
      return res.json(404, { error: { status: 404, message: 'Message not found', details: 'Message has not been found ' + uuid}});
    }
    res.json(200, result);
  });
}

function copy(req, res) {
  if (!req.body.resource) {
    return res.json(400, { error: { code: 400, message: 'Bad request', details: 'resource is required'}});
  }

  if (!req.body.target || req.body.target && !req.body.target.length) {
    return res.json(400, { error: { code: 400, message: 'Bad request', details: 'target body is required'}});
  }

  var id = req.param('id');
  var resource = req.body.resource;
  var target = req.body.target;

  messageModule.copy(id, req.user._id, resource, target, function(err, copy) {
    if (err) {
      return res.json(500, { error: { code: 500, message: 'Server Error', details: 'Cannot copy message. ' + err.message}});
    }

    if (!copy) {
      return res.json(404, { error: { code: 404, message: 'Message not found', details: 'Message has not been found ' + id}});
    }

    publishMessageEvents(copy, req.body.target, req.user);
    res.json(201, { _id: copy._id});
  });
}

function createMessageFromEmail(req, res) {

  var objectType = req.query.objectType ||  req.query.objectType;
  if (!objectType) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'objectType is mandatory'}});
  }

  var id = req.query.id;
  if (!id) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'ID is mandatory'}});
  }

  var shares = [{objectType: objectType, id: id}];
  emailModule.saveEmail(req, req.user, shares, function(err, email) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Server error', details: err.message}});
    }

    if (email) {
      var targets = messageSharesToTimelineTarget(email.shares);
      var activity = require('../../core/activitystreams/helpers').userMessageToTimelineEntry(email, 'post', req.user, targets);
      localpubsub.topic('message:activity').publish(activity);
      globalpubsub.topic('message:activity').publish(activity);
      return res.json(201, { _id: email._id});
    }
    return res.json(404, { error: { status: 404, message: 'Not found', details: 'Can not find created message'}});
  });
}

module.exports = {
  createOrReplyToMessage: create,
  getMessages: get,
  getMessage: getOne,
  copy: copy,
  createMessageFromEmail: createMessageFromEmail
};
