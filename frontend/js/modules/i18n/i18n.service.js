(function() {
  'use strict';

  angular.module('esn.i18n')
    .factory('esnI18nService', function($translate, EsnI18nString, ESN_I18N_DEFAULT_LOCALE) {
      return {
        getLocale: getLocale,
        translate: translate,
        isI18nString: isI18nString
      };

      function getLocale() {
        return $translate.preferredLanguage() || ESN_I18N_DEFAULT_LOCALE;
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
