'use strict';

var maxSizeUpload = 104857600; // is equal to 100 MO

module.exports = function() {
  return {
    maxSizeUpload: maxSizeUpload
  };
};
