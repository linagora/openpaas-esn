'use strict';

var user = require('../user/listener');
var logger = require('../logger');

module.exports.init = function() {
  logger.debug('Initializing the elasticsearch pubsub channel');
  user.register();
};
