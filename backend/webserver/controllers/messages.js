'use strict';

var messageModule = require('../../core/message'),
    postToModel = require(__dirname + '/../../helpers/message').postToModelMessage,
    pubsub = require('../../core/pubsub').local;

function create(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return res.send(500, { error: { status: 500, message: 'Server Error', details: 'User is not set.'}});
  }

  if (!req.body) {
    return res.send(400, 'Missing message in body');
  }

  var message = postToModel(req.body, req.user),
      topic = pubsub.topic('message:activity');
  messageModule.save(message, function(err, saved) {
    if (err) {
      return res.send(
        500,
        { error: { status: 500, message: 'Server Error', details: 'Cannot create message . ' + err.message}});
    }

    if (saved) {
      var from = { type: 'user', resource: req.user._id },
          targets = req.body.targets;
      topic.publish({
        source: from,
        targets: targets,
        message: saved,
        date: new Date(),
        verb: 'post'
      });
      return res.send(201, { _id: saved._id});
    }

    return res.send(404);
  });
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

    if(result.length > 0) {
      return res.send(200, result);
    }

    return res.send(404);
  });
}

module.exports = {
  createMessage: create,
  getMessages: get
};
