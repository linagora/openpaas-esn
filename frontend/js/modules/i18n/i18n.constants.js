(function() {
  'use strict';

  angular.module('esn.i18n')
    .constant('ESN_I18N_DEFAULT_LOCALE', 'en')
    .constant('ESN_I18N_AVAILABLE_LANGUAGE', ['en', 'fr', 'vi'])
    .constant('ESN_I18N_AVAILABLE_LANGUAGE_KEYS', {
      'en_*': 'en',
      'fr_*': 'fr',
      'vi_*': 'vi'
    })
    .constant('ESN_I18N_DATE_FORMAT', {
      en: 'yyyy/MM/dd',
      fr: 'dd/MM/yyyy',
      vi: 'dd/MM/yyyy'
    })
    .constant('ESN_I18N_LONG_DATE_FORMAT', {
      en: 'EEE yyyy/MM/dd',
      fr: 'EEE dd/MM/yyyy',
      vi: 'EEE dd/MM/yyyy'
    });
})();
