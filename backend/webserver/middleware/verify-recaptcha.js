'use strict';

var Recaptcha = require('recaptcha').Recaptcha;

var PUBLIC_KEY = '6Ldu4O8SAAAAAHqn2ifj-eQVetUksEo7VQdvzXM9',
    PRIVATE_KEY = '6Ldu4O8SAAAAAGfiRRJCaqbVTid4a19W-CRux_nn';

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

  var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY, data);

  recaptcha.verify(function(success, error_code) {
    if (success) {
      return next();
    } else {
      return res.json(403, {
        recaptcha: true,
        error: {
          code: 403,
          message: 'Login error',
          details: 'Invalid recaptcha'
        }
      });
    }
  });
};
