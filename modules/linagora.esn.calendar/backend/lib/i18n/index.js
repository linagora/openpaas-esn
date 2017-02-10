'use strict';

const i18n = require('i18n');
const q = require('q');
const DEFAULT_LOCALE = 'en';
let helpers;

i18n.configure(
  {
    defaultLocale: DEFAULT_LOCALE,
    locales: ['en', 'fr', 'vi'],
    directory: __dirname + '/locales',
    updateFiles: false,
    indent: '  ',
    extension: '.json',
    cookie: 'locale'
  }
);

module.exports = function(dependencies) {
  helpers = require('./helpers')(dependencies);
  return {
    i18n,
    getI18nForMailer,
    helpers,
    DEFAULT_LOCALE
  };
};

function getI18nForMailer(user) {
  const i18nForMailer = require('i18n');
  i18nForMailer.configure(
    {
      defaultLocale: DEFAULT_LOCALE,
      directory: __dirname + '/locales',
      updateFiles: false,
      indent: '  ',
      extension: '.json'
    }
  );

  const localePromise = user ? helpers.getLocaleForUser(user) : q.when(DEFAULT_LOCALE);

  return localePromise
    .then((locale = DEFAULT_LOCALE) => ({
        i18n: i18nForMailer,
        locale,
        translate: phrase => i18nForMailer.__({phrase, locale})
      })
    )
    .catch(() => ({
      i18n: i18nForMailer,
      locale: DEFAULT_LOCALE,
      translate: i18nForMailer.__
    }));
}
