(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxMessageBodyText', {
      templateUrl: '/unifiedinbox/app/components/message-body/text/message-body-text.html',
      bindings: {
        message: '<'
      }
    });

})();
