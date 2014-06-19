'use strict';

var MongoLDAPStrategy = require('../../core/passport/ldap-mongo').Strategy;

module.exports = {
  name: 'mongo-ldap',
  strategy: new MongoLDAPStrategy({}, function(user, done) {
    if (user) {
      return done(null, user);
    } else {
      return done(new Error('Can not find user in LDAP'));
    }
  })
};
