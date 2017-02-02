'use strict';

const LocalStrategy = require('passport-local').Strategy;

module.exports = {
  name: 'mongo-ldap',
  strategy: new LocalStrategy(require('../../core/passport/ldap-mongo'))
};
