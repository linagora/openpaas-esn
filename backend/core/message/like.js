'use strict';

var q = require('q');
var pubsub = require('../pubsub');
var logger = require('../logger');

function listen() {
  pubsub.local.topic('resource:link:like:esn.message').subscribe(function(data) {
    logger.info('Someone liked a message...', data);
  });
}
module.exports.listen = listen;
