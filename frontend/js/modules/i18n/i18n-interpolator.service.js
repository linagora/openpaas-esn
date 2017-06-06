(function() {
  'use strict';

  angular.module('esn.i18n')
  .factory('esnI18nInterpolator', esnI18nInterpolator);

  function esnI18nInterpolator() {
    return {
      setLocale: function() {},
      getInterpolationIdentifier: function() {
        return 'esnI18nInterpolator';
      },
      interpolate: function(string, interpolateParams) {
        return string.replace(/(%s)/g, function() {
          return interpolateParams.shift();
        });
      }
    };
  }
})();
