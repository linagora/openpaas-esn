(function() {
  'use strict';

  angular.module('esn.i18n')
    .config(function($translateProvider, ESN_I18N_AVAILABLE_LANGUAGES, ESN_I18N_AVAILABLE_LANGUAGE_ALIASES, ESN_I18N_DEFAULT_LOCALE) {
      $translateProvider.useLoader('esnI18nLoader');
      $translateProvider.preferredLanguage(ESN_I18N_DEFAULT_LOCALE);
      $translateProvider.determinePreferredLanguage(); //Try to guess language from window.navigator
      $translateProvider.fallbackLanguage(ESN_I18N_DEFAULT_LOCALE);
      $translateProvider.registerAvailableLanguageKeys(ESN_I18N_AVAILABLE_LANGUAGES.map(function(language) {
        return language.key;
      }), ESN_I18N_AVAILABLE_LANGUAGE_ALIASES);
      $translateProvider.useInterpolation('esnI18nInterpolator');
      $translateProvider.useSanitizeValueStrategy('escape');
    });
})();
