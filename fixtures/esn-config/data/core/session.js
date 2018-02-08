'use strict';

const randomstring = require('randomstring');

module.exports = function() {
  return {
    remember: 2592000000,
    secret: randomstring.generate(40)
  };
};
