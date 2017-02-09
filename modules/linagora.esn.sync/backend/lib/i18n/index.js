'use strict';

module.exports = function(dependencies) {
  const i18n = dependencies('i18n');

  i18n.setDefaultConfiguration({ directory: __dirname + '/locales' });

  return i18n;
};
