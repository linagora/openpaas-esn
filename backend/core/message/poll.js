'use strict';

var logger = require(__dirname + '/../../core').logger,
mongoose = require('mongoose'),
PollMessage = mongoose.model('PollMessage'),
pubsub = require('../pubsub').local,
permission = require('./permission');

module.exports.save = function(message, callback) {
  var eventMessage = new PollMessage(message),
  topic = pubsub.topic('message:stored');
  eventMessage.save(function(err, response) {
    if (!err) {
      topic.publish(response);
      logger.info('Added new event message in database:', { _id: response._id.toString() });
    } else {
      logger.warn('Error while trying to add a new event message in database:', err.message);
    }
    callback(err, response);
  });
};

function hasAlreadyVoted(message, tuple) {
  return message.pollResults.some(function(result) {
    return result.actor.objectType === tuple.objectType && result.actor.id.equals(tuple.id);
  });
}

module.exports.canVote = function(message, tuple, callback) {
  if (!message.pollChoices ||   !message.pollChoices.length) {
    return callback(null, false);
  }
  if (!message.pollResults) {
    return callback(null, false);
  }
  if (hasAlreadyVoted(message, tuple)) {
    return callback(null, false);
  }

  permission.canRead(message, tuple, callback);
};

module.exports.vote = function(message, tuple, pollVote, callback) {
  message.pollResults.push({
    actor: tuple,
    vote: pollVote
  });
  message.save(callback);
};
