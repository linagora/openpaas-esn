'use strict';

module.exports = function(dependencies) {
  const pubsub = require('./pubsub')(dependencies);
  const search = require('./search')(dependencies);
  const davImport = require('./dav-import')(dependencies);
  const people = require('./people')(dependencies);

  function start(callback) {
    pubsub.listen();
    search.listen();
    davImport.init();
    people.init();
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
