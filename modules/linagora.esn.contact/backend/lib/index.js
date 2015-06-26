'use strict';

module.exports = function(dependencies) {

  return {
    actions: require('./actions')(dependencies)
  };
};
