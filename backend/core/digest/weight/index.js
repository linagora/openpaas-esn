'use strict';

var q = require('q');
var strategy = require('./simple');

/**
 * Compute messages weight based on the message, its unread responses, etc...
 * The current strategy is to compute several weights:
 *
 * - The individual message weight. For example, a thread with 3 unread responses out of 8, a single message without responses.
 * - The collaboration message weight. A message may have a priority based on the collaboration context.
 *
 * The input data contains:
 *
 * - messages: Array of messages.
 * - collaboration: The collaboration where messages have been published
 */
function compute(user, data) {

  if (!user || !data) {
    return q.reject(new Error('User and data are required'));
  }

  if (!data.messages || data.messages.length === 0) {
    return q(data);
  }

  var individual = data.messages.map(function(message) {
    return strategy.computeIndividualMessageWeight(user, message);
  });

  return q.all(individual).then(function(individualResults) {
    data.messages = individualResults;

    var collaborationWeight = data.messages.map(function(message) {
      return strategy.computeMessageWeightInCollaboration(user, message, data.collaboration, data.messages);
    });

    return q.all(collaborationWeight).then(function(collaborationResults) {
      data.messages = collaborationResults;
      return data;
    });
  });
}
module.exports.compute = compute;
