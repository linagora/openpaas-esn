(function() {
  'use strict';

  angular.module('esn.i18n')
  .factory('esnI18nDateFormatService', esnI18nDateFormatService);

  function esnI18nDateFormatService(esnI18nService, ESN_I18N_DATE_FORMAT, ESN_I18N_DEFAULT_LOCALE) {
    return {
      getDateFormat: getDateFormat
    };

    function getDateFormat() {
      return ESN_I18N_DATE_FORMAT[esnI18nService.getLocale().substring(0, 2)] || ESN_I18N_DATE_FORMAT[ESN_I18N_DEFAULT_LOCALE];
    }
  }
})();
