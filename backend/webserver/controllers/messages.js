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

module.exports = {
  createMessage: create
};
