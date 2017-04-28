'use strict';

var alterTemplatePath = require('../middleware/templates').alterTemplatePath;

const assetRegistry = require('../../core').assets;

/**
 * Get /
 * @param {request} req
 * @param {response} res
 */
function index(req, res) {
  res.locals.assets = assetRegistry.envAwareApp('esn');

  alterTemplatePath('esn/index', function(tplPath) {
    return res.render(tplPath, {
      title: 'Home'
    });
  });
}

module.exports.index = index;
