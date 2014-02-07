'use strict';

//
// LDAP server based on ldap.js.
//

var ldap = require('ldapjs');

var authorize = function(req, res, next) {
  return next();
};

var SUFFIX = 'ou=passport-ldapauth';
var server = null;

var db = {
  'ldapuser': {
    dn: 'uid=ldapuser,ou=passport-ldapauth',
    attributes: {
      uid: 'ldapuser',
      name: 'LDAP User',
      email: 'ldapuser@linagora.com'
    }
  }
};
var password = 'secret';

var adminDN = {
  dn: 'uid=admin,ou=passport-ldapauth',
  password: 'secret'
};

exports.start = function(port, cb) {
  if (server) {
    if (typeof cb === 'function') {
      return cb();
    }
    return;
  }

  server = ldap.createServer();

  server.bind(adminDN.dn, function(req, res, next) {
    if (req.dn.toString() !== adminDN.dn || req.credentials !== adminDN.password) {
      return next(new ldap.InvalidCredentialsError());
    }
    res.end();
    return next();
  });

  server.bind(SUFFIX, authorize, function(req, res, next) {
    var dn = req.dn.toString();

    if (dn !== db.ldapuser.dn || req.credentials !== password) {
      return next(new ldap.InvalidCredentialsError());
    }
    res.end();
    return next();
  });

  server.search(SUFFIX, authorize, function(req, res, next) {
    if (req.filter.value === db.ldapuser.attributes.uid || req.filter.value === db.ldapuser.attributes.email) {
      res.send(db.ldapuser);
    }
    res.end();
    return next();
  });

  server.listen(port, function() {
    if (typeof cb === 'function') {
      return cb();
    }
  });
};

exports.close = function(cb) {
  if (server) {
    server.close();
  }
  server = null;
  if (typeof cb === 'function') {
    return cb();
  }
  return;
};
