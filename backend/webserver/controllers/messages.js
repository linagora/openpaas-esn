'use strict';

var messageModule = require('../../core/message'),
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
  messageModule.save(message, function(err, saved) {
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

  messageModule.addNewComment(message, inReplyTo, function(err, childMessage, parentMessage) {
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

module.exports = {
  createOrReplyToMessage: create,
  getMessages: get,
  getMessage: getOne
};
