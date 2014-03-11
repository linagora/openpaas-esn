'use strict';

var Recaptcha = require('recaptcha').Recaptcha;

var PUBLIC_KEY = '6Ldu4O8SAAAAAHqn2ifj-eQVetUksEo7VQdvzXM9',
    PRIVATE_KEY = '6Ldu4O8SAAAAAGfiRRJCaqbVTid4a19W-CRux_nn';

module.exports.verify = function(req, res, next) {

  if(!req.body.recaptcha) {
    return next();
  }

  var data = {
    remoteip:  req.connection.remoteAddress,
    challenge: req.body.recaptcha.challenge,
    response:  req.body.recaptcha.response
  };

  var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY, data);

  recaptcha.verify(function(success, error_code) {
    if (success) {
      return next();
    } else {
      return res.json(400, {
        error: {
          code: 400,
          message: 'Invalid captcha',
          details: error_code
        }
      });
    }
  });
};
