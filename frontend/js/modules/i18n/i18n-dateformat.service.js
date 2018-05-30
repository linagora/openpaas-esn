(function() {
  'use strict';

  angular.module('esn.i18n')
  .factory('esnI18nDateFormatService', esnI18nDateFormatService);

  function esnI18nDateFormatService(esnI18nService, ESN_I18N_DATE_FORMAT, ESN_I18N_LONG_DATE_FORMAT, ESN_I18N_DEFAULT_LOCALE) {
    return {
      getDateFormat: getDateFormat,
      getLongDateFormat: getLongDateFormat
    };

    function getDateFormat() {
      return get(ESN_I18N_DATE_FORMAT);
    }

    function getLongDateFormat() {
      return get(ESN_I18N_LONG_DATE_FORMAT);
    }

    function get(format) {
      return format[esnI18nService.getLocale().substring(0, 2)] || format[ESN_I18N_DEFAULT_LOCALE];
    }
  }
})();
