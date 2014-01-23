'use strict';

var i18n = require('i18n');
i18n.configure(
  {
    defaultLocale: 'en',
    directory: __dirname + '/locales',
    updateFiles: false,
    indent: '  ',
    extension: '.js'
  }
);

exports = module.exports = i18n;
