(function() {
  'use strict';

  angular.module('esn.i18n')
    .constant('ESN_I18N_DEFAULT_LOCALE', 'en')
    .constant('ESN_I18N_DEFAULT_FULL_LOCALE', 'en-US')
    .constant('ESN_I18N_AVAILABLE_LANGUAGES', [
      { key: 'en', label: 'English' },
      { key: 'fr', label: 'Français' },
      { key: 'vi', label: 'Tiếng Việt' },
      { key: 'zh', label: '中文' },
      { key: 'ru', label: 'Pусский'}
    ])
    .constant('ESN_I18N_AVAILABLE_LANGUAGE_ALIASES', {
      'en_*': 'en',
      'fr_*': 'fr',
      'vi_*': 'vi',
      'zh_*': 'zh',
      'ru_*': 'ru'
    })
    .constant('ESN_I18N_FULL_LOCALE', {
      en: 'en-US',
      fr: 'fr-FR',
      vi: 'vi-VN',
      zh: 'zh-TW',
      ru: 'ru-RU'
    })
    .constant('ESN_I18N_DATE_FORMAT', {
      en: 'yyyy/MM/dd',
      fr: 'dd/MM/yyyy',
      vi: 'dd/MM/yyyy',
      zh: 'yyyy/MM/dd',
      ru: 'dd/MM/yyyy'
    })
    .constant('ESN_I18N_LONG_DATE_FORMAT', {
      en: 'EEE yyyy/MM/dd',
      fr: 'EEE dd/MM/yyyy',
      vi: 'EEE dd/MM/yyyy',
      zh: 'EEE yyyy/MM/dd',
      ru: 'EEE dd/MM/yyyy'
    });
})();
