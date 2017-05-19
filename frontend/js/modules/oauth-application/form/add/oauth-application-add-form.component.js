(function() {
  'use strict';

  angular.module('esn.oauth-application')
    .component('esnOauthApplicationAddForm', {
      bindings: {
        onCreated: '&'
      },
      controller: 'ESNOauthApplicationAddFormController',
      templateUrl: '/views/modules/oauth-application/form/add/oauth-application-add-form.html'
    });
})();
