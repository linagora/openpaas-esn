'use strict';

const LdapAuth = require('ldapauth-fork');
const async = require('async');
const _ = require('lodash');
const esnConfig = require('../esn-config');

/**
 * Check if the email exists in the given ldap
 *
 * @param {String} email - email to search
 * @param {hash} ldap - LDAP configuration
 * @param {Function} callback - as fn(err, username) where username is defined if found
 */
function emailExists(email, ldap, callback) {
  if (!email || !ldap) {
    return callback(new Error('Missing parameters'));
  }

  var ldapauth = new LdapAuth(ldap);

  return ldapauth._findUser(email, callback);
}

/**
 * Try to find a user in all the registered LDAPs.
 *
 * @param {String} email - the email to search in the LDAPs
 * @param {Function} callback - as fn(err, ldap) where ldap is the first LDAP entry where the user has been found
 */
function findLDAPForUser(email, callback) {
  return esnConfig('ldap').getFromAllDomains().then(function(ldaps) {
    if (!ldaps || ldaps.length === 0) {
      return callback(new Error('No configured LDAP'));
    }

    // ldaps could be an array of arrays OR an array of objects so we make it flat
    var ldapConfigs = [].concat.apply([], ldaps).filter(Boolean);

    if (!ldapConfigs || ldapConfigs.length === 0) {
      return callback(new Error('No configured LDAP'));
    }

    async.filter(ldapConfigs, function(ldap, callback) {
      emailExists(email, ldap.configuration, callback);
    }, callback);
  });
}

/**
 * Authenticate a user on the given LDAP
 *
 * @param {String} email
 * @param {String} password
 * @param {hash} ldap - LDAP configuration
 * @param {function} callback - as function(err, user) where user is not null when authenticated
 */
function authenticate(email, password, ldap, callback) {
  if (!email || !password || !ldap) {
    return callback(new Error('Can not authenticate from null values'));
  }

  var ldapauth = new LdapAuth(ldap);

  ldapauth.authenticate(email, password, function(err, user) {
    ldapauth.close(function() {});
    if (err) {
      return callback(new Error('Can not authenticate user ' + email + ' : ' + err.message));
    }

    if (!user) {
      return callback(new Error('Can not authenticate user ' + email + ' : null user'));
    }

    return callback(null, user);
  });
}

/**
 * Translate ldapPayload to OpenPaaS user
 * @param  {Object} ldapPayload The LDAP payload returned by LDAP strategy
 * @return {Object}             The OpenPaaS user object
 */
function translate(ldapPayload) {
  var email = ldapPayload.username; // we use email as username to authenticate LDAP
  var domainId = ldapPayload.domainId;
  var ldapUser = ldapPayload.user;
  var mapping = ldapPayload.config.mapping;
  var provisionUser = {
    accounts: [{
      type: 'email',
      hosted: true,
      emails: [email]
    }],
    domains: [{
      domain_id: domainId
    }]
  };

  _.forEach(mapping, function(value, key) {
    if (key === 'email') {
      var email = ldapUser[value];

      if (provisionUser.accounts[0].emails.indexOf(email) === -1) {
        provisionUser.accounts[0].emails.push(email);
      }
    } else {
      provisionUser[key] = ldapUser[value];
    }
  });

  return provisionUser;
}

module.exports = {
  findLDAPForUser,
  emailExists,
  authenticate,
  translate
};
