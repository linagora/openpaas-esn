'use strict';

const alterTemplatePath = require('../middleware/templates').alterTemplatePath;
const assetRegistry = require('../../core').assets;
const { i18nConfigTemplate } = require('../../core/i18n/index');
const esnConfig = require('../../core/esn-config');

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

  const domainId = req.user.preferredDomainId.toString();

  getLocale().then(config => {
    const locale = config || i18nConfigTemplate.defaultLocale;
    const fullLocale = i18nConfigTemplate.fullLocales.hasOwnProperty(config) ? i18nConfigTemplate.fullLocales[config] : config || i18nConfigTemplate.defaultLocale;

    alterTemplatePath('esn/index', tplPath => res.render(tplPath, {
      title: 'Home',
      locale,
      fullLocale,
      domainId
    }));
  });

  function getLocale() {
    return esnConfig('language').inModule('core').forUser(req.user, true).get();
  }
}
