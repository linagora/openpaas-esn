'use strict';

var config = require('../../core/esn-config')('recaptcha'),
    logger = require('../../core/logger'),
    alterTemplatePath = require('../middleware/templates').alterTemplatePath;

const assetRegistry = require('../../core').assets;

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
        return res.status(500).json({
          error: 500,
          message: 'Server Error',
          details: 'Internal server error'
        });
      }

      res.locals.assets = assetRegistry.app('welcome');
      alterTemplatePath('welcome/index', function(tplPath) {
        res.render(tplPath, {
          title: 'Home',
          recaptchaPublicKey: recaptcha ? recaptcha.publickey : null
        });
      });
    });
  } else {
    res.locals.assets = assetRegistry.app('esn');
    alterTemplatePath('esn/index', function(tplPath) {
      return res.render(tplPath, {
        title: 'Home'
      });
    });
  }
}

module.exports.index = index;
