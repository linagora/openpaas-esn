(function() {
  'use strict';

  angular.module('esn.oauth-application')
    .component('esnOauthApplicationAddFormModal', {
      bindings: {
        onCreated: '&'
      },
      templateUrl: '/views/modules/oauth-application/form/add/oauth-application-add-form-modal.html'
    });
})();
