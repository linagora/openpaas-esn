'use strict';

var extend = require('extend');
var i18n = require('i18n');
var path = require('path');
var isAbsolute = require('path-is-absolute');
var localConfig = require('../core/config')('default');
var ROOT_FOLDER = path.normalize(__dirname + '../../..');

var i18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'fr'],
  directory: './backend/i18n/locales',
  updateFiles: false,
  indent: '  ',
  extension: '.json',
  cookie: 'locale'
};

extend(i18nConfig, localConfig.i18n || {});
i18nConfig.directory = isAbsolute(i18nConfig.directory) ? i18nConfig.directory : path.join(ROOT_FOLDER, i18nConfig.directory);
i18n.configure(i18nConfig);

exports = module.exports = i18n;
