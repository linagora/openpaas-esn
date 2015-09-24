'use strict';

angular.module('openpaas-site', ['ngRoute', 'pascalprecht.translate'])
.config(['$translateProvider', function ($translateProvider) {
  Object.keys(languages).forEach(function(lang) {
    $translateProvider.translations(lang, languages[lang]);
  });

  $translateProvider.determinePreferredLanguage()
                    .fallbackLanguage('en');

}])
.run(['$route', function($route) {

}]);
