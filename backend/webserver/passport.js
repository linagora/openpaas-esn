'use strict';

//
// Passport configuration and utils. All strategies will be added here.
//

var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var config = require('../core').config('default');

var strategies = {
  file: new BasicStrategy(require('../core/auth/file'))
};

var auth = 'file';
if (config.auth && config.auth.strategy) {
  auth = config.auth.strategy;
}
passport.use(strategies[auth]);
