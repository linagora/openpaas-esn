'use strict';

var Recaptcha = require('recaptcha').Recaptcha,
    config = require('../../core/esn-config')('recaptcha'),
    logger = require('../../core/logger');

module.exports.verify = function(req, res, next) {

  if (!req.recaptchaFlag) {
    return next();
  }

  if (!req.body.recaptcha || !req.body.recaptcha.data) {
    return res.status(403).json({
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
      return res.status(500).json({
        error: 500,
        message: 'Server Error',
        details: 'Internal server error'
      });
    }

    if (!recaptchaConfig) {
      return next();
    }

    var recaptcha = new Recaptcha(recaptchaConfig.publickey, recaptchaConfig.privatekey, data);

    recaptcha.verify(function(success) {
      if (success) {
        return next();
      }
      return res.status(403).json({
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
