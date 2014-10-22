'use strict';

module.exports.local = require('./local');
module.exports.global = require('./global');

module.exports.init = function() {
  require('../activitystreams/pubsub').init();
  require('../notification/pubsub').init();
};
