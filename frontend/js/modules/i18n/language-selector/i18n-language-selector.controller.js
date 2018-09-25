(function(angular) {
  'use strict';

  angular.module('esn.i18n')
    .controller('esnI18nLanguageSelectorController', esnI18nLanguageSelectorController);

  function esnI18nLanguageSelectorController(ESN_I18N_AVAILABLE_LANGUAGES) {
    var self = this;

    self.languages = ESN_I18N_AVAILABLE_LANGUAGES;
  }
})(angular);
