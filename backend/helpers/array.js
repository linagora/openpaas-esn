'use strict';

module.exports.isNullOrEmpty = function(array) {
  return (!Array.isArray(array) || array.length === 0);
};
