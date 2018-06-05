(function(angular) {
  'use strict';

  angular.module('esn.material').config(configBlock);

  function configBlock($mdThemingProvider) {
    var openpaasPalette = $mdThemingProvider.extendPalette('indigo', {
      500: '#2196F3'
    });

    $mdThemingProvider.definePalette('openpaas', openpaasPalette);
    $mdThemingProvider.theme('default').primaryPalette('openpaas');
  }

})(angular);
