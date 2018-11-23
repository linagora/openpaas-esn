(function() {
  'use strict';

  angular.module('esn.i18n')
    .factory('esnI18nService', function($translate, EsnI18nString, esnConfig, ESN_I18N_DEFAULT_LOCALE, ESN_I18N_DEFAULT_FULL_LOCALE, ESN_I18N_FULL_LOCALE) {
      return {
        getLocale: getLocale,
        getFullLocale: getFullLocale,
        translate: translate,
        isI18nString: isI18nString
      };

      function getLocale() {
        return $translate.use() || $translate.preferredLanguage() || ESN_I18N_DEFAULT_LOCALE;
      }

      function getFullLocale(callback) {
        return esnConfig('core.language', ESN_I18N_DEFAULT_LOCALE)
        .then(function(locale) {
          var fullLocale = ESN_I18N_FULL_LOCALE.hasOwnProperty(locale) ? ESN_I18N_FULL_LOCALE[locale] : ESN_I18N_DEFAULT_FULL_LOCALE;

          return callback && typeof callback === 'function' ? callback(fullLocale) : fullLocale;
        });
      }

      function translate(text) {
        if (!text || text instanceof EsnI18nString) {
          return text;
        }

        if (typeof text === 'string') {
          var params = (arguments.length > 1) ? Array.prototype.slice.call(arguments).slice(1) : [];

          return new EsnI18nString(text, params);
        }

        throw new TypeError('The input text must be a string or an EsnI18nString object');
      }

      function isI18nString(text) {
        return text instanceof EsnI18nString;
      }
    });
})();
