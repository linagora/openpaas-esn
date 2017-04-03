(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxIdentity', {
      templateUrl: '/unifiedinbox/app/components/identity/identity.html',
      bindings: {
        identityId: '@'
      },
      controller: 'inboxIdentityController'
    });

})();
