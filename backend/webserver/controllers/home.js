'use strict';

var config = require('../../core/esn-config')('recaptcha'),
    logger = require('../../core/logger'),
    alterTemplatePath = require('../middleware/templates').alterTemplatePath;
/**
 * Get /
 * @param {request} req
 * @param {response} res
 */
function index(req, res) {
  if (!req.user) {
    config.get(function(err, recaptcha) {
      if (err) {
        logger.error('Could not get recaptcha keys in esn config.', err.message);
        return res.json(500, {
          error: 500,
          message: 'Server Error',
          details: 'Internal server error'
        });
      }
      alterTemplatePath('welcome/index', function(tplPath) {
        res.render(tplPath, {
          title: 'Home',
          recaptchaPublicKey: recaptcha ? recaptcha.publickey : null
        });
      });
    });
  } else {
    alterTemplatePath('esn/index', function(tplPath) {
      return res.render(tplPath, {
        title: 'Home'
      });
    });
  }
}

module.exports.index = index;
