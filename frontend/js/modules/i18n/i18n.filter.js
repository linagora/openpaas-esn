(function() {
  'use strict';

  angular.module('esn.i18n')
    .filter('esnI18n', function(esnI18nService) {
      return function(input) {
        var translatedInput = esnI18nService.translate(input);

        return translatedInput && typeof translatedInput.toString === 'function' ? translatedInput.toString() : input;
      };
    });
})();
