'use strict';

var mongoose = require('mongoose');
var baseMessage = require('./base-message');
var extend = require('extend');

var pollSpecificSchema = {
  objectType: {type: String, required: true, default: 'pollmessage'},
  content: {type: String, required: true},
  pollChoices: {type: Array},
  pollResults: {type: Array}
};

extend(true, pollSpecificSchema, baseMessage);
var PollMessageSchema = new mongoose.Schema(pollSpecificSchema, { collection: 'messages' });

function validatePollChoices(choices) {
  if (!choices) {
    return new Error('Validation error: poll choices cannot be null');
  }
  if (choices.length < 2) {
    return new Error('Validation error: poll should have at least two choices');
  }
  var noLabels = choices.filter(function(choice) {
    return !choice || !choice.label;
  });
  if (noLabels.length) {
    return new Error('Validation error: poll choices should have a label property');
  }
}

function validatePollResults(results) {
  if (!results || !results.length) {
    return null;
  }
  var goodResults = results.every(function(result) {
    return result.hasOwnProperty('vote') &&
            result.hasOwnProperty('actor') &&
            result.actor &&
            result.actor.hasOwnProperty('objectType') &&
            result.actor.hasOwnProperty('id');
  });
  if (!goodResults) {
    return new Error('At least one result is bady formatted');
  }
}

PollMessageSchema.pre('save', function(next) {
  var error = validatePollChoices(this.pollChoices) || validatePollResults(this.pollResults);
  next(error);
});

module.exports = mongoose.model('PollMessage', PollMessageSchema);
