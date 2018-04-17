(function() {
  'use strict';

  angular.module('esn.i18n')
    .run(function(amMoment, esnI18nService) {
      amMoment.changeLocale(esnI18nService.getLocale());
    });
})();
