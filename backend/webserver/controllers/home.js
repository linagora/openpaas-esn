'use strict';

const alterTemplatePath = require('../middleware/templates').alterTemplatePath;
const assetRegistry = require('../../core').assets;

module.exports = {
  index
};

/**
 * Get /
 * @param {request} req
 * @param {response} res
 */
function index(req, res) {
  res.locals.assets = assetRegistry.envAwareApp('esn');
  const locale = req.getLocale();

  alterTemplatePath('esn/index', tplPath => res.render(tplPath, {
    title: 'Home',
    locale
  }));
}
