'use strict';

module.exports = function(dependencies) {
  return function(options) {
    return {
      addressbook: require('./addressbook')(dependencies, options)
    };
  };
};
