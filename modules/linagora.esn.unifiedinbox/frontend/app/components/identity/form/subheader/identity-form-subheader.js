(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .component('inboxIdentityFormSubheader', {
      templateUrl: '/unifiedinbox/app/components/identity/form/subheader/identity-form-subheader.html',
      bindings: {
        identityId: '@',
        onSave: '&',
        form: '<'
      }
    });

})();
