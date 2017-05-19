(function() {
  'use strict';

  angular.module('esn.oauth-application')
    .component('esnOauthApplicationList', {
      controller: 'ESNOauthApplicationListController',
      templateUrl: '/views/modules/oauth-application/list/oauth-application-list.html'
    });
})();
