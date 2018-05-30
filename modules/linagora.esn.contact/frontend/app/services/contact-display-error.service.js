(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactDisplayError', contactDisplayError);

  function contactDisplayError($alert, esnI18nService) {
    return function(err) {
      $alert({
        content: esnI18nService.translate(err).toString(),
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '.contact-error-container',
        duration: '3',
        animation: 'am-flip-x'
      });
    };
  }
})(angular);
