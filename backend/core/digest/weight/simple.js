'use strict';

var q = require('q');

function computeMessageWeight(user, message, messages) {
  message.weight = 0;

  if (!message.responses) {
    return q(message);
  }

  message.responses.forEach(function(response) {
    if (!response.read) {
      message.weight++;
    }
  });
  return q(message);
}
module.exports.computeMessageWeight = computeMessageWeight;
