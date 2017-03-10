'use strict';

const DEFAULT_LOCALE = 'en';

let helpers;
let i18n;

module.exports = function(dependencies) {
  helpers = require('./helpers')(dependencies);
  i18n = dependencies('i18n');

  i18n.setDefaultConfiguration({ defaultLocale: DEFAULT_LOCALE, directory: __dirname + '/locales' });

  return {
    i18n,
    getI18nForMailer,
    helpers,
    DEFAULT_LOCALE
  };
};

function getI18nForMailer(user) {
  const localePromise = user ? helpers.getLocaleForUser(user) : helpers.getLocaleForSystem();

  return localePromise
    .then((locale = DEFAULT_LOCALE) => ({
        i18n: i18n,
        locale,
        translate: phrase => i18n.__({phrase, locale})
      })
    )
    .catch(() => ({
      i18n: i18n,
      locale: DEFAULT_LOCALE,
      translate: i18n.__
    }));
}
