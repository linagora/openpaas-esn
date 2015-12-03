'use strict';

module.exports = function(dependencies) {
  return {
    importer: require('./importer')(dependencies),
    mapping: require('./mapping')(dependencies)
  };
};
