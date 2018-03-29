'use strict';

module.exports = function(dependencies) {
  const pubsub = require('./pubsub')(dependencies);
  var search = require('./search')(dependencies);

  function start(callback) {
    pubsub.listen();
    search.listen();
    callback();
  }

  return {
    start: start,
    search: search,
    davClient: require('./dav-client'),
    client: require('./client')(dependencies),
    constants: require('./constants'),
    helper: require('./helper')
  };
};
