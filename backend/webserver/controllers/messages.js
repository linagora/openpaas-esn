'use strict';

var whatsupModule = require('../../core/message/whatsup'),
  messageModule = require('../../core/message'),
  emailModule = require('../../core/message/email'),
  postToModel = require(__dirname + '/../../helpers/message').postToModelMessage,
  localpubsub = require('../../core/pubsub').local,
  globalpubsub = require('../../core/pubsub').global;

function messageSharesToTimelineTarget(shares) {
  return shares.map(function(e) {
    return {
      objectType: e.objectType,
      _id: e.id
    };
  });
}

function createNewMessage(message, req, res) {
  whatsupModule.save(message, function(err, saved) {
    if (err) {
      return res.send(
        500,
        { error: { status: 500, message: 'Server Error', details: 'Cannot create message . ' + err.message}});
    }

    if (saved) {
      var targets = messageSharesToTimelineTarget(req.body.targets);
      var activity = require('../../core/activitystreams/helpers').userMessageToTimelineEntry(saved, 'post', req.user, targets);
      localpubsub.topic('message:activity').publish(activity);
      globalpubsub.topic('message:activity').publish(activity);
      return res.send(201, { _id: saved._id});
    }

    return res.send(404);
  });
}

function commentMessage(message, inReplyTo, req, res) {
  if (!inReplyTo._id) {
    return res.send(400, 'Missing inReplyTo _id in body');
  }

  if (!messageModule.type[inReplyTo.objectType]) {
    return res.send(400, 'Can not comment message on message with type' + inReplyTo.objectType);
  }

  messageModule.type[inReplyTo.objectType].addNewComment(message, inReplyTo, function(err, childMessage, parentMessage) {
    if (err) {
      return res.send(
        500,
        { error: { status: 500, message: 'Server Error', details: 'Cannot add commment. ' + err.message}});
    }

    var targets = messageSharesToTimelineTarget(parentMessage.shares);
    var activity = require('../../core/activitystreams/helpers').userMessageCommentToTimelineEntry(childMessage, 'post', req.user, targets, inReplyTo, new Date());
    localpubsub.topic('message:activity').publish(activity);
    globalpubsub.topic('message:activity').publish(activity);
    return res.send(201, { _id: childMessage._id, parentId: parentMessage._id });
  });
}

function create(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return res.send(500, { error: { status: 500, message: 'Server Error', details: 'User is not set.'}});
  }

  if (!req.body) {
    return res.send(400, 'Missing message in body');
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

  whatsupModule.findByIds(req.query.ids, function(err, result) {
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

  whatsupModule.get(uuid, function(err, result) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Server Error', details: 'Cannot get message. ' + err.message}});
    }

    if (!result) {
      return res.json(404, { error: { status: 404, message: 'Message not found', details: 'Message has not been found ' + uuid}});
    }
    res.json(200, result);
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
      var activity = require('../../core/activitystreams/helpers').userMessageToTimelineEntry(email, 'email', req.user, targets);
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
  createMessageFromEmail: createMessageFromEmail
};
