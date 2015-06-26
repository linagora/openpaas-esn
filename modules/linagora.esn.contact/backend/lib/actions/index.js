'use strict';

module.exports = function(dependencies) {
  return {
    delete: require('./delete')(dependencies)
  };
};
