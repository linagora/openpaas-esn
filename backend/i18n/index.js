'use strict';

const i18n = require('../core/i18n');

i18n.setDefaultConfiguration({ multiDirectories: true, directory: __dirname + '/locales' });

exports = module.exports = i18n;
