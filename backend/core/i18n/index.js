'use strict';

const i18n = require('@linagora/i18n-node');

const i18nConfigTemplate = {
  defaultLocale: 'en',
  locales: ['en', 'fr', 'vi', 'zh', 'ru'],
  fullLocales: {
    en: 'en-US',
    fr: 'fr-FR',
    vi: 'vi-VN',
    zh: 'zh-TW',
    ru: 'ru-RU'
  },
  fallbacks: {
    'en-*': 'en',
    'fr-*': 'fr',
    'vi-*': 'vi',
    'zh-*': 'zh',
    'ru-*': 'ru'
  },
  updateFiles: false,
  indent: '  ',
  extension: '.json',
  cookie: 'locale'
};

/**
 * Set default configuration for i18n
 *
 * @param {Object} options - Object contains attributes which will be overrided or added into i18nConfig
 */
function setDefaultConfiguration(options) {
  const i18nConfig = Object.assign({}, i18nConfigTemplate, options);

  i18n.configure(i18nConfig);
}

module.exports = i18n;
module.exports.i18nConfigTemplate = i18nConfigTemplate;
module.exports.setDefaultConfiguration = setDefaultConfiguration;
