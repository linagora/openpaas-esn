'use strict';

var BasicStrategy = require('passport-http').BasicStrategy;

module.exports = {
  name: 'basic-mongo',
  strategy: new BasicStrategy(require('../../../core/auth/mongo').auth)
};
