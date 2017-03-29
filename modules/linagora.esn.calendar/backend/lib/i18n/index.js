'use strict';

const DEFAULT_LOCALE = 'en';

module.exports = function(dependencies) {
  const helpers = require('./helpers')(dependencies);
  const i18n = dependencies('i18n');

  i18n.setDefaultConfiguration({ defaultLocale: DEFAULT_LOCALE, directory: __dirname + '/locales' });

  return {
    getI18nForMailer,
    helpers,
    i18n,
    DEFAULT_LOCALE
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
};
