(function(angular) {
  'use strict';

  angular.module('esn.i18n')
    .controller('esnI18nLanguageSelectorController', esnI18nLanguageSelectorController);

  function esnI18nLanguageSelectorController(ESN_I18N_AVAILABLE_LANGUAGES) {
    var self = this;

    self.languages = ESN_I18N_AVAILABLE_LANGUAGES;
    self.setLanguage = setLanguage;
    self.isLanguageSelected = isLanguageSelected;

    function setLanguage(language, form) {
      if (language.key !== self.language) {
        self.language = language.key;
        form.$setDirty();
      }
    }

    function isLanguageSelected(language) {
      return self.language === language.key;
    }
  }
})(angular);
