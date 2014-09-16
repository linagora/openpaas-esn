'use strict';

var core = require('../../core'),
    topic = core.pubsub.local.topic('webserver:mongosessionstoreEnabled'),
    maxWaitTTL = 5000;


function startupBuffer(timeout) {
  var bypass = false;
  var queue = [];
  timeout = timeout || maxWaitTTL;

  function removeBuffer() {
    bypass = true;
    while (queue.length) { queue.pop()(); }
  }

  topic.subscribe(removeBuffer);
  setTimeout(removeBuffer, timeout);

  return function(req, res, next) {
    if (bypass) { return next(); }
    queue.push(next);
  };
}

module.exports = startupBuffer;
