'use strict';

module.exports.local = require('./local');
module.exports.global = require('./global');

module.exports.init = function() {
  require('../activitystreams/pubsub').init();
  require('../notification/pubsub').init();
  require('../elasticsearch/pubsub').init();
  require('../resource-link/pubsub').init();
};
