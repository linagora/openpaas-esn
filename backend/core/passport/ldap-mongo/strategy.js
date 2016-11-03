'use strict';

var passport = require('passport'),
  ldap = require('../../ldap'),
  usermodule = require('../../user'),
  _ = require('lodash');

/**
 * Strategy constructor
 *
 * The LDAP+Mongo authentication strategy authenticates requests based on the
 * credentials submitted through an HTML-based login form.
 *
 * It also provision a user in the system if needed when authentication is successful.
 *
 * Applications may supply a `verify` callback which accepts `user` object
 * and then calls the `done` callback supplying a `user`, which should be set
 * to `false` if user is not allowed to authenticate. If an exception occured,
 * `err` should be set.
 *
 * Options:
 * - `usernameField`  field name where the username is found, defaults to _username_
 * - `passwordField`  field name where the password is found, defaults to _password_
 * - `passReqToCallback`  when `true`, `req` is the first argument to the verify callback (default: `false`)
 *
 * Example:
 *
 *     var LdapMongoStrategy = require('passport/ldap-mongo').Strategy;
 *     passport.use(new LdapMongoStrategy({},
 *       function(user, done) {
 *         return cb(null, user);
 *       }
 *     ));
 */

class Strategy extends passport.Strategy {

  constructor(options, verify) {
    super();

    this.name = 'ldap-mongo';
    this.options = null;
    this.getOptions = null;
    this.verify = verify;

    if (!options) {
      throw new Error('LDAP Mongo authentication strategy requires options');
    }

    if (typeof options === 'object') {
      this.options = addDefaults(options);
    } else if (typeof options === 'function') {
      this.getOptions = options;
    } else {
      throw new Error('options must be an object or a function');
    }
  }

  /**
   * Authenticate the request coming from a form or such.
   */
  authenticate(req) {
    var self = this;

    if ((typeof self.options === 'object') && (!self.getOptions)) {
      return self._handleAuthentication(req, self.options);
    }

    self.getOptions(function(err, configuration) {
      if (err) {
        return self.fail(err);
      }

      self.options = addDefaults(configuration);
      self._handleAuthentication(req, self.options);
    });
  }

  _handleAuthentication(req, options) {
    var username, password, self;

    options || (options = {});

    username = lookup(req.body, this.options.usernameField) || lookup(req.query, this.options.usernameField);
    password = lookup(req.body, this.options.passwordField) || lookup(req.query, this.options.passwordField);

    if (!username || !password) {
      return this.fail('Missing credentials');
    }

    self = this;
    usermodule.findByEmail(username, function(err, user) {
      var provision = false;

      if (err || !user) {
        provision = true;
      }

      ldap.findLDAPForUser(username, function(err, ldaps) {
        if (err) {
          return self.fail('LDAP is not configured for this user :' + err);
        }

        if (!ldaps || ldaps.length === 0) {
          return self.fail('Can not find any LDAP for this user');
        }

        // authenticate user on the first LDAP for now
        ldap.authenticate(username, password, ldaps[0].configuration, function(err, ldapuser) {
          if (err) {
            // Invalid credentials / user not found are not errors but login failures
            if (err.name === 'InvalidCredentialsError' || err.name === 'NoSuchObjectError' || (typeof err === 'string' && err.match(/no such user/i))) {
              return self.fail('Invalid username/password');
            }

            // Other errors are (most likely) real errors
            return self.error(err);
          }

          if (!ldapuser) {
            return self.fail('User information not found');
          }

          if (provision) {
            var provision_user = {
              accounts: [{
                type: 'email',
                hosted: true,
                emails: [username]
              }],
              domains: [{
                domain_id: ldaps[0].domain_id
              }]
            };
            var ldap = ldaps[0];

            if (ldap.configuration && ldap.configuration.mapping) {
              var mappings = ldap.configuration.mapping;

              _.forEach(mappings, function(value, key) {
                if (key === 'email') {
                  var email = ldapuser[value];

                  if (provision_user.accounts[0].emails.indexOf(email) === -1) {
                    provision_user.accounts[0].emails.push(email);
                  }
                } else {
                  provision_user[key] = ldapuser[value];
                }
              });
            }

            usermodule.provisionUser(provision_user, function(err, saved) {
              if (err) {
                return self.error(new Error('Can not provision user'));
              }
              self._finalize(saved, req);
            });
          } else {
            self._finalize(user, req);
          }
        });
      });
    });
  }

  _finalize(user, req) {
    if (this.verify) {
      if (this.options.passReqToCallback) {
        return this.verify(req, user, this._verify());
      }

      return this.verify(user, this._verify());
    }

    return this.success(user);
  }

  /**
   * Verify the outcome of caller verify function - even if authentication (and
   * usually authorization) is taken care by LDAP there may be reasons why
   * a verify callback is provided, and again reasons why it may reject login
   * for a valid user.
   */
  _verify() {
    var self = this;

    // Callback given to user given verify function.
    return function(err, user, info) {
      if (err) {
        return self.error(err);
      }

      if (!user) {
        return self.fail(info);
      }

      return self.success(user, info);
    };
  }

}

/**
 * Get value for given field from given object. Taken from passport-local
 */
function lookup(obj, field) {
  var i, len, chain, prop;

  if (!obj) { return null; }
  chain = field.split(']').join('').split('[');
  for (i = 0, len = chain.length; i < len; i++) {
    prop = obj[chain[i]];
    if (typeof prop === 'undefined') { return null; }
    if (typeof prop !== 'object') { return prop; }
    obj = prop;
  }

  return null;
}

function addDefaults(options) {
  options.usernameField || (options.usernameField = 'username');
  options.passwordField || (options.passwordField = 'password');

  return options;
}

module.exports = Strategy;
