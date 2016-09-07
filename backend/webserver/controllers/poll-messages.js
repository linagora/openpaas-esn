'use strict';

var messagePollModule = require('../../core/message/poll');
var messageModule = require('../../core/message');
var publishMessageEvents = require('../../helpers/message').publishMessageEvents;

function vote(req, res, next) {
  var messageId = req.params.id;
  var pollVote = parseInt(req.params.vote, 10);
  var tuple = {objectType: 'user', id: req.user._id};
  if (!messageId) {
    return res.status(400).json({ error: { status: 400, message: 'Bad request', details: 'objectType is mandatory'}});
  }
  if (isNaN(pollVote)) {
    return res.status(400).json({ error: { status: 400, message: 'Bad request', details: 'message vote should be a number'}});
  }
  messageModule.dryGet(messageId, function(err, message) {
    if (err) {
      return res.status(500).json({ error: { status: 500, message: 'Internal server error', details: err.message}});
    }
    if (!message) {
      return res.status(404).json({ error: { status: 404, message: 'Not Found', details: 'message ' + messageId + ' does not exist'}});
    }

    messagePollModule.canVote(message, tuple, function(err, isAllowedToVote) {
      if (err) {
        return res.status(500).json({ error: { status: 500, message: 'Internal server error', details: err.message}});
      }

      if (!isAllowedToVote) {
        return res.status(403).json({ error: { status: 403, message: 'Forbidden', details: 'Not allowed to vote'}});
      }

      messagePollModule.vote(message, tuple, pollVote, function(err, message) {
        if (err) {
          return res.status(500).json({ error: { status: 500, message: 'Internal server error', details: err.message}});
        }
        publishMessageEvents(message, message.shares, req.user, 'update');
        return res.status(200).json(message);
      });
    });
  });
}

module.exports.vote = vote;
