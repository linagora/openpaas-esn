'use strict';

var LocalStrategy = require('passport-local').Strategy;

module.exports = {
  name: 'local',
  strategy: new LocalStrategy(require('../../core/auth/file').auth)
};
