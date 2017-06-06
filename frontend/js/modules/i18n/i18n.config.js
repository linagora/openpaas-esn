(function() {
  'use strict';

  angular.module('esn.i18n')
    .config(function(_, $translateProvider, ESN_I18N_AVAILABLE_LANGUAGE, ESN_I18N_AVAILABLE_LANGUAGE_KEYS) {
      angular.element.ajax('/api/i18n')
        .then(function(res) {
          _.each(res, function(catalog, lang) {
            $translateProvider.translations(lang, catalog);
          });
        });

      $translateProvider.preferredLanguage('en');
      $translateProvider.determinePreferredLanguage(); //Try to guess language from window.navigator
      $translateProvider.fallbackLanguage('en');
      $translateProvider.registerAvailableLanguageKeys(ESN_I18N_AVAILABLE_LANGUAGE, ESN_I18N_AVAILABLE_LANGUAGE_KEYS);
      $translateProvider.useInterpolation('esnI18nInterpolator');
      $translateProvider.useSanitizeValueStrategy('escape');
    });
})();
