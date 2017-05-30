(function() {
  'use strict';

  angular.module('esn.i18n')
    .config(function(_, $translateProvider, ESN_I18N_AVAILABLE_LANGUAGE, ESN_I18N_AVAILABLE_LANGUAGE_KEYS) {
      angular.element.ajax('/api/i18n')
        .then(function(res) {
          _.each(res, function(catalog, lang) {
            $translateProvider.translations(lang, catalog);
          });
        }, function() {
          var $log = angular.injector(['ng']).get('$log');// Retrieving $log manually because the service itself has not been instantiated yet

          $log.log('Error while loading translations');
        });

      $translateProvider.preferredLanguage('en');
      $translateProvider.determinePreferredLanguage(); //Try to guess language from window.navigator
      $translateProvider.fallbackLanguage('en');
      $translateProvider.registerAvailableLanguageKeys(ESN_I18N_AVAILABLE_LANGUAGE, ESN_I18N_AVAILABLE_LANGUAGE_KEYS);
      $translateProvider.useInterpolation('esnI18nArrayInterpolation');
      $translateProvider.useSanitizeValueStrategy('escape');
    });
})();
