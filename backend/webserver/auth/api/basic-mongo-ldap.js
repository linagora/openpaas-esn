'use strict';

const BasicStrategy = require('passport-http').BasicStrategy;

module.exports = {
  name: 'basic-mongo-ldap',
  strategy: new BasicStrategy(require('../../../core/passport/ldap-mongo'))
};
