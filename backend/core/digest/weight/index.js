'use strict';

var q = require('q');
var DEFAULT_STRATEGY = require('./strategies/date');
var arrayHelper = require('../../../helpers/array');

function getStrategy() {
  return DEFAULT_STRATEGY;
}

 /**
 * The input data contains:
 *
 * - messages: Array of messages.
 * - collaboration: The collaboration where messages have been published
 */
function compute(user, data) {

  if (!user || !data) {
    return q.reject(new Error('User and data are required'));
  }

  if (arrayHelper.isNullOrEmpty(data.messages)) {
    return q(data);
  }

  var strategy = getStrategy(user, data);
  data.messages = strategy.computeMessagesWeight(data.messages);
  return q(data);
}
module.exports.compute = compute;
