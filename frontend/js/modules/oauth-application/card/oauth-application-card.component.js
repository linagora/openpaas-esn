(function() {
  'use strict';

  angular.module('esn.oauth-application')
    .component('esnOauthApplicationCard', {
      bindings: {
        application: '<'
      },
      templateUrl: '/views/modules/oauth-application/card/oauth-application-card.html'
    });
})();
