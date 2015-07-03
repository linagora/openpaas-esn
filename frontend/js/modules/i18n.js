'use strict';

angular.module('esn.i18n', ['restangular'])
  .controller('localeController', function($scope, $window, i18nAPI) {
    var prettyLocales = {
      'en': 'English',
      'fr': 'Français'
    };
    var unPrettyLocales = {
      'English': 'en',
      'Français': 'fr'
    };
    i18nAPI.getCurrentLocale().then(function(locale) {
      $scope.selectedLocale = prettyLocales[locale.replace(/"/g, '')];
    });

    i18nAPI.getSupportedLocale().then(function(locales) {
      $scope.supportedLocales = locales.map(function(locale) {
        return prettyLocales[locale.replace('"', '')];
      });
    });

    $scope.setLocale = function(locale) {
      var unPrettyLocale = unPrettyLocales[locale];
      i18nAPI.setLocale(unPrettyLocale).then(function() {
        $scope.selectedLocale = locale;
        $window.location.href = '/';
      });
    };
  })
  .factory('i18nAPI', function(Restangular) {

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
  });

