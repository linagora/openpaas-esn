(function() {
  'use strict';

  angular.module('esn.oauth-application')
    .component('esnOauthApplicationView', {
      controller: 'ESNOauthApplicationViewController',
      templateUrl: '/views/modules/oauth-application/view/oauth-application-view.html'
    });
})();
