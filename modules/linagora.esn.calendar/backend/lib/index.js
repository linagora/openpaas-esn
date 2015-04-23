'use strict';

/**
 * This is the main exported file describing the api of your AwesomeModule.
 * @param {Object} dependencies
 * @param {Function} callback
 * @return {*}
 */
module.exports = function(dependencies, callback) {
  var lib = {};
  var start = function(webserver, callback) {
    lib.started = true;
    return callback();
  };

  lib.start = start;

  return callback(null, lib);
};
