const async = require('async');
const q = require('q');
const urljoin = require('url-join');
const mongoose = require('mongoose');

const logger = require('../../core/logger');
const esnConfig = require('../esn-config');
const pubsub = require('../pubsub').local;
const globalpubsub = require('../pubsub').global;
const jwt = require('../auth').jwt;
const email = require('../email');
const i18n = require('../../i18n');
const helpers = require('../../helpers');
const { isSupportedTimeZone } = require('../../helpers/datetime');
const CONSTANTS = require('./constants');

const User = mongoose.model('User');
const PasswordReset = mongoose.model('PasswordReset');

const DEFAULT_LOGIN_FAILURE = 5;

module.exports = {
  canLogin,
  failure,
  firstSuccess,
  sendPasswordReset,
  setDisabled,
  success
};

function firstSuccess(email, data = {}, callback) {
  User.loadFromEmail(email, (err, user) => {
    if (err) {
      return callback(err);
    }
    if (!user) {
      return callback(new Error(`No such user ${email}`));
    }

    return _onFirstSuccess(user, data)
      .catch(err => logger.error(`Error while setting for user ${email} at the first success login`, err))
      .finally(() => {
        pubsub.topic('login:success').publish(user);
        user.loginSuccess(callback);
      });
  });
}

function success(email, callback) {
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
}

function failure(email, callback) {
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
}

function canLogin(email, callback) {
  var size = DEFAULT_LOGIN_FAILURE;
  esnConfig('login').get(function(err, data) {
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
}

function sendPasswordReset(user, callback) {
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
      subject: i18n.__('You have requested a password reset on OpenPaas')
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
}

function setDisabled(user, disabled, callback) {
  user.login.disabled = disabled;
  user.save(function(err, result) {
    if (err) {
      return callback(err);
    }
    pubsub.topic(CONSTANTS.EVENTS.userDisabled).forward(globalpubsub, {user: result, disabled: disabled});
    callback(null, result);
  });
}

function _onFirstSuccess(user, data) {
  function _setLanguageForUser() {
    return esnConfig('language').inModule('core').forUser(user, true).store(data.language);
  }

  function _setTimeZoneForUser() {
    if (isSupportedTimeZone(data.timeZone)) {
      return esnConfig('datetime').inModule('core').forUser(user, true).set('timeZone', data.timeZone);
    }
  }

  return [_setLanguageForUser, _setTimeZoneForUser].reduce(q.when, q());
}
