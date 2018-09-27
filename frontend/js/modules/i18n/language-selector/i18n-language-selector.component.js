(function(angular) {
  'use strict';

  angular.module('esn.i18n')
    .component('esnI18nLanguageSelector', {
      templateUrl: '/views/modules/i18n/language-selector/i18n-language-selector.html',
      bindings: {
        language: '=',
        mode: '@'
      },
      controller: 'esnI18nLanguageSelectorController'
    });
})(angular);
