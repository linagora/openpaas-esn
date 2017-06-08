(function() {
  'use strict';

  angular.module('esn.i18n')
    .filter('esnI18n', function(esnI18nService) {
      return function(input) {
        return esnI18nService.translate(input).toString();
      };
    });
})();
