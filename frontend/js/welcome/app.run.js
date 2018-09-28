(function(angular) {
  'use strict';

  angular.module('welcomeApp')
    .run(settingLanguage);

  function settingLanguage($cookies, $translate, ESN_I18N_DEFAULT_LOCALE) {
    if ($cookies.locale) {
      $translate.use($cookies.locale);
    } else {
      $cookies.locale = ESN_I18N_DEFAULT_LOCALE;
    }
  }
})(angular);
