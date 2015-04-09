'use strict';

var q = require('q');

function getOrInitWeight(message) {
  return message.weight || {};
}

function computeMessageWeightInCollaboration(user, message, collaboration, messages) {
  message.weight = getOrInitWeight(message);
  message.weight.collaboration = 1;
  return q(message);
}
module.exports.computeMessageWeightInCollaboration = computeMessageWeightInCollaboration;

function computeIndividualMessageWeight(user, message) {
  message.weight = getOrInitWeight(message);
  message.weight.individual = 1;
  return q(message);
}
module.exports.computeIndividualMessageWeight = computeIndividualMessageWeight;
