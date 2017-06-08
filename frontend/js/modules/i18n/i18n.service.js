(function() {
  'use strict';

  angular.module('esn.i18n')
    .factory('esnI18nService', function(EsnI18nString) {
      return {
        translate: translate
      };

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
    });
})();
