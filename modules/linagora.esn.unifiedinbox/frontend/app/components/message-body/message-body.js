(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxMessageBody', {
      templateUrl: '/unifiedinbox/app/components/message-body/message-body.html',
      bindings: {
        message: '<',
        autoScaleDisabled: '<'
      }
    });

})();
