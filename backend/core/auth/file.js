'use strict';

//
// File-based user database.
// The user file is located under the config directory and ysers are serialized as JSON array.
//

var passport = require('passport');
var bcrypt = require('bcrypt-nodejs');

passport.serializeUser(function(user, done) {
  done(null, user.username);
});
passport.deserializeUser(function(username, done) {
  done(null, { username: username });
});

var users;
try {
  users = require('../../../config/users.json').users;
} catch (err) {
  users = [];
}

/**
 * Authenticate a user from its username and password
 *
 * @param {String} username
 * @param {String} password
 * @param {Function} done
 */
function auth(username, password, done) {
  var user;
  for (var i in users) {
    var u = users[i];
    if (u.username  === username) {
      user = u;
    }
  }

  if (!user) {
    return done(null, false, { message: 'user not found'});
  }

  comparePassword(password, user.password, function(err, isMatch) {
    if (isMatch) {
      return done(null, { username: username });
    }
    return done(null, false, { message: 'invalid password for user ' + username});
  });
}
module.exports = exports = auth;

/**
 * Crypt a password
 *
 * @param {String} password
 */
function crypt(password, callback) {
  var SALT_FACTOR = 5;
  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) {
      return callback(err);
    }
    bcrypt.hash(password, salt, null, function(err, hash) {
      if (err) {
        return callback(err);
      } else {
        return callback(err, hash);
      }
    });
  });
}

/**
 * Compare passwords
 *
 * @param {String} a
 * @param {String} b
 * @param {Function} cb
 */
function comparePassword(a, b, cb) {
  bcrypt.compare(a, b, function(err, isMatch) {
    if(err) {
      return cb(err);
    } else {
      cb(null, isMatch);
    }
  });
}
