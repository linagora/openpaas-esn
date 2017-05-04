'use strict';

module.exports = dependencies => ({
  constants: require('./constants'),
  pubsub: require('./pubsub')(dependencies)
});
