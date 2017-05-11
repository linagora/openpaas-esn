(function() {
  'use strict';

  angular.module('esn.i18n')
    .factory('esnI18nArrayInterpolation', function() {

      return {
        setLocale: function() {},
        getInterpolationIdentifier: function() {
          return 'esnI18nArrayInterpolation';
        },
        interpolate: function(string, interpolateParams) {
          return string.replace(/(%s)/g, function() {
            return interpolateParams.shift();
          });
        }
      };
    });
})();
