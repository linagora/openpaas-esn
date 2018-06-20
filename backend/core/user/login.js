'use strict';

var async = require('async');
var urljoin = require('url-join');
var mongoose = require('mongoose');

var config = require('../esn-config')('login');
var pubsub = require('../pubsub').local;
var globalpubsub = require('../pubsub').global;
var jwt = require('../auth').jwt;
var email = require('../email');
var i18n = require('../../i18n');
var helpers = require('../../helpers');
var CONSTANTS = require('./constants');

var User = mongoose.model('User');
var PasswordReset = mongoose.model('PasswordReset');

var DEFAULT_LOGIN_FAILURE = 5;

module.exports.success = function(email, callback) {
  User.loadFromEmail(email, function(err, user) {
    if (err) {
      return callback(err);
    }
    if (!user) {
      return callback(new Error('No such user ' + email));
    }
    pubsub.topic('login:success').publish(user);
    user.loginSuccess(callback);
  });
};

module.exports.failure = function(email, callback) {
  User.loadFromEmail(email, function(err, user) {
    if (err) {
      return callback(err);
    }
    if (!user) {
      return callback(new Error('No such user ' + email));
    }
    pubsub.topic('login:failure').publish(user);
    user.loginFailure(callback);
  });
};

module.exports.canLogin = function(email, callback) {
  var size = DEFAULT_LOGIN_FAILURE;
  config.get(function(err, data) {
    if (data && data.failure && data.failure.size) {
      size = data.failure.size;
    }

    User.loadFromEmail(email, function(err, user) {
      if (err) {
        return callback(err);
      }
      if (!user) {
        return callback(new Error('No such user ' + email));
      }
      if (user.login.failures && user.login.failures.length >= size) {
        return callback(null, false);
      }
      return callback(err, true);
    });
  });
};

module.exports.sendPasswordReset = function(user, callback) {
  var to = user.preferredEmail;

  function getConfiguration(callback) {
    async.parallel([
      helpers.config.getNoReply,
      helpers.config.getBaseUrl.bind(null, user)
    ], callback);
  }

  function generateJWTurl(baseUrl, callback) {
    var payload = {email: to, action: 'PasswordReset'};
    jwt.generateWebToken(payload, function(err, token) {
      callback(err, urljoin(baseUrl, '/passwordreset/?jwt=' + token));
    });
  }

  function createNewPasswordReset(url, callback) {
    new PasswordReset({ email: to, url: url }).save(function(err) {
      callback(err, { email: to, url: url });
    });
  }

  function updatePasswordResetUrl(url, callback) {
    PasswordReset.findOneAndUpdate({ email: to }, { $set: { url: url } }, function(err) {
      callback(err, { email: to, url: url });
    });
  }

  function sendEmail(noreply, passwordreset, callback) {
    var message = {
      from: noreply,
      to: to,
      subject: i18n.__('You have requested a password reset on OpenPaaS')
    };
    var templateName = 'core.password-reset';
    var context = {
      firstname: user.firstname,
      lastname: user.lastname,
      url: passwordreset.url
    };

    email.getMailer(user).sendHTML(message, templateName, context, callback);
  }

  getConfiguration(function(err, results) {
    if (err) {
      return callback(err);
    }

    var noreply = results[0];
    var baseUrl = results[1];

    PasswordReset.find({email: to}, function(err, result) {
      if (result && result.length) {
        var url = result[0].url;
        var baseJwtUrl = url.substring(0, url.indexOf('/passwordreset'));

        if (baseJwtUrl !== baseUrl) {
          // make a new jwturl with baseUrl of webConfig and update url of PasswordReset
          async.waterfall([
            generateJWTurl.bind(null, baseUrl),
            updatePasswordResetUrl,
            sendEmail.bind(null, noreply)
          ], callback);
        } else {
          sendEmail(noreply, result[0], callback);
        }
      } else {
        async.waterfall([
          generateJWTurl.bind(null, baseUrl),
          createNewPasswordReset,
          sendEmail.bind(null, noreply)
        ], callback);
      }
    });
  });
};

module.exports.setDisabled = function(user, disabled, callback) {
  user.login.disabled = disabled;
  user.save(function(err, result) {
    if (err) {
      return callback(err);
    }
    pubsub.topic(CONSTANTS.EVENTS.userDisabled).forward(globalpubsub, {user: result, disabled: disabled});
    callback(null, result);
  });
};
