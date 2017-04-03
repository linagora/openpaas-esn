(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxIdentityForm', {
      templateUrl: '/unifiedinbox/app/components/identity/form/identity-form.html',
      bindings: {
        identityId: '@'
      },
      controller: 'inboxIdentityFormController'
    });

})();
