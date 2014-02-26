'use strict';

angular.module('esn.i18n', ['restangular'])
  .controller('localeController', function($scope, i18nAPI) {
    i18nAPI.getCurrentLocale().then(function(locale) {
      $scope.selectedLocale = locale;
    });

    i18nAPI.getSupportedLocale().then(function(locales) {
      $scope.supportedLocales = locales;
    });

    $scope.setLocale = function(locale) {
      i18nAPI.setLocale(locale).then(function() {
        $scope.selectedLocale = locale;
      });
    };
  })
  .factory('i18nAPI', ['Restangular', function(Restangular) {

    function getSupportedLocale() {
      return Restangular.one('locales').get();
    }

    function getCurrentLocale() {
      return Restangular.one('locales', 'current').get();
    }

    function setLocale(locale) {
      return Restangular.one('locales', locale).get();
    }

    return {
      getSupportedLocale: getSupportedLocale,
      getCurrentLocale: getCurrentLocale,
      setLocale: setLocale
    };
  }]);

