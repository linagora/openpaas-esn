'use strict';

var core = require('../../core'),
    topic = core.pubsub.local.topic('webserver:mongosessionstoreEnabled'),
    maxWaitTTL = 10000;


function startupBuffer() {
  var bypass = false;
  var queue = [];

  function removeBuffer() {
    bypass = true;
    while (queue.length) { queue.pop()(); }
  }

  topic.subscribe(removeBuffer);
  setTimeout(removeBuffer, maxWaitTTL);

  return function(req, res, next) {
    if (bypass) { return next(); }
    queue.push(next);
  };
}

module.exports = startupBuffer;
