'use strict';

const BasicStrategy = require('@linagora/passport-http').BasicStrategy;

module.exports = {
  name: 'basic-mongo-ldap',
  // config xhrChallengeType to rename the Basic challenge in 401 Unauthorized response,
  // so users will not see login dialog when they consume API protected by this basic-mongo-ldap strategy while not logged in
  strategy: new BasicStrategy({ xhrChallengeType: 'customBasic' }, require('../../../core/passport/ldap-mongo'))
};
