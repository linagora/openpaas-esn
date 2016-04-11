'use strict';

module.exports = function(dependencies) {
  return {
    twitter: require('./twitter')(dependencies),
    google: require('./google')(dependencies),
    facebook: require('./facebook')(dependencies)
  };
};
