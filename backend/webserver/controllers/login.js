'use strict';

const passport = require('passport');
const config = require('../../core').config('default');
const userlogin = require('../../core/user/login');
const esnConfig = require('../../core/esn-config');
const logger = require('../../core/logger');
const alterTemplatePath = require('../middleware/templates').alterTemplatePath;
const assetRegistry = require('../../core').assets;
const i18n = require('../../core/i18n');

module.exports = {
  index,
  login,
  passwordResetIndex,
  user
};

function index(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect(req.query.continue || '/');
  }

  esnConfig('recaptcha').get((err, recaptcha) => {
    if (err) {
      logger.error('Could not get recaptcha keys in esn config.', err.message);

      return res.status(500).json({
        error: 500,
        message: 'Server Error',
        details: 'Internal server error'
      });
    }

    res.locals.assets = assetRegistry.envAwareApp('welcome');

    alterTemplatePath('welcome/index', tplPath => {
      res.render(tplPath, {
        title: 'Home',
        recaptchaPublicKey: recaptcha ? recaptcha.publickey : null
      });
    });
  });
}

function login(req, res, next) {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({
      recaptcha: req.recaptchaFlag || false,
      error: {
        code: 400,
        message: 'Login error',
        details: 'Bad parameters, missing username and/or password'
      }
    });
  }

  const username = req.body.username;
  const strategies = config.auth && config.auth.strategies ? config.auth.strategies : ['local'];

  passport.authenticate(strategies, (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      userlogin.failure(username, err => {
        if (err) {
          logger.error('Problem while setting login failure for user ' + username, err);
        }

        return res.status(403).json({
          recaptcha: req.recaptchaFlag || false,
          error: {
            code: 403,
            message: 'Login error',
            details: 'Bad username or password'
          }
        });
      });
    } else {
      req.logIn(user, err => {
        if (err) {
          return next(err);
        }

        function parseAcceptLanguage(acceptLanguageHeader = '') {
          const supportedLanguages = i18n.getLocales();
          const acceptLanguages = acceptLanguageHeader.split(',').map(element => element.split(';')[0]);
          let language;

          acceptLanguages.some(acceptLanguage => {
            if (supportedLanguages.indexOf(acceptLanguage) > 0) {
              language = acceptLanguage;

              return true;
            }
          });

          return language;
        }

        function callback(err, user) {
          if (err) {
            logger.error('Problem while setting login success for user ' + username, err);
          }

          let result = {};

            if (user) {
              result = user.toObject();
              delete result.password;
            }

            res.status(200).json(result);
        }

        if (!user.login.success) {
          return userlogin.firstSuccess(
            username,
            { language: parseAcceptLanguage(req.headers['accept-language']) || 'en' },
            callback
          );
        }

        return userlogin.success(username, callback);
      });
    }
  })(req, res, next);
}

function passwordResetIndex(req, res) {
  alterTemplatePath('password-reset/index', tplPath => res.render(tplPath, { title: 'PasswordReset' }));
}

function user(req, res) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return res.status(500).send({
      error: {
        code: 500,
        message: 'Internal error',
        details: 'User not set'
      }
    });
  }

  res.status(200).json(req.user);
}
