'use strict';

var Recaptcha = require('recaptcha').Recaptcha,
    config = require('../../core/esn-config')('recaptcha'),
    logger = require('../../core/logger');

module.exports.verify = function(req, res, next) {

  if (!req.recaptchaFlag) {
    return next();
  }

  if (!req.body.recaptcha || !req.body.recaptcha.data) {
    return res.json(403, {
      recaptcha: true,
      error: {
        code: 403,
        message: 'Login error',
        details: 'Too many attempts'
      }
    });
  }

  var data = {
    remoteip: req.connection.remoteAddress,
    challenge: req.body.recaptcha.data.challenge,
    response: req.body.recaptcha.data.response
  };

  config.get(function(err, recaptchaConfig) {
    if (err) {
      logger.error('Could not get recaptcha keys in esn config.', err.message);
      return res.json(500, {
        error: 500,
        message: 'Server Error',
        details: 'Internal server error'
      });
    }

    if (!recaptchaConfig) {
      return next();
    }

    var recaptcha = new Recaptcha(recaptchaConfig.publickey, recaptchaConfig.privatekey, data);

    recaptcha.verify(function(success, error_code) {
      if (success) {
        return next();
      }
      return res.json(403, {
        recaptcha: true,
        error: {
          code: 403,
          message: 'Login error',
          details: 'Invalid recaptcha'
        }
      });
    });
  });
};
