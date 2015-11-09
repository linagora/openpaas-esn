'use strict';

module.exports = function(dependencies) {
  return {
    twitter: require('./twitter')(dependencies)
  };
};
