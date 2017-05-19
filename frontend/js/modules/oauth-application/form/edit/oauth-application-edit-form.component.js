(function() {
  'use strict';

  angular.module('esn.oauth-application')
    .component('esnOauthApplicationEditForm', {
      bindings: {
        application: '<'
      },
      controller: 'ESNOauthApplicationEditFormController',
      templateUrl: '/views/modules/oauth-application/form/edit/oauth-application-edit-form.html'
    });
})();
