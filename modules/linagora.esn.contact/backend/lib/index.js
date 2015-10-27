'use strict';

module.exports = function(dependencies) {

  var search = require('./search')(dependencies);

  function start(callback) {
    search.listen();
    callback();
  }

  return {
    start: start,
    search: search,
    davClient: require('./dav-client'),
    client: require('./client')(dependencies)
  };
};
