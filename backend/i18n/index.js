'use strict';

const extend = require('extend');
const path = require('path');
const isAbsolute = require('path-is-absolute');
const localConfig = require('../core/config')('default');
const ROOT_FOLDER = path.normalize(__dirname + '../../..');
const i18n = require('../core/i18n');

const i18nConfig = {
  multiDirectories: true,
  directory: __dirname + '/locales'
};

extend(i18nConfig, localConfig.i18n || {});
i18nConfig.directory = isAbsolute(i18nConfig.directory) ? i18nConfig.directory : path.join(ROOT_FOLDER, i18nConfig.directory);

i18n.setDefaultConfiguration(i18nConfig);

exports = module.exports = i18n;
