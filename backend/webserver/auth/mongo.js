'use strict';

var LocalStrategy = require('passport-local').Strategy;

module.exports = {
  name: 'mongo',
  strategy: new LocalStrategy(require('../../core/auth/mongo').auth)
};
