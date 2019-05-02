(function(angular) {
  'use strict';

  angular.module('esn.material').config(configBlock);

  function configBlock($mdThemingProvider) {
    var openpaasPalette = $mdThemingProvider.extendPalette('indigo', {
      50: 'e4f2fe',
      100: 'bce0fb',
      200: '90cbf9',
      300: '64b6f7',
      400: '42a6f5',
      500: '2196f3',
      600: '1d8ef1',
      700: '1883ef',
      800: '1479ed',
      900: '0b68ea',
      A100: 'ffffff',
      A200: 'e1ecff',
      A400: 'aeccff',
      A700: '95bcff'
    });

    $mdThemingProvider.definePalette('openpaas', openpaasPalette);
    $mdThemingProvider.theme('default').primaryPalette('openpaas');
  }

})(angular);
