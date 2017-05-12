(function() {
  'use strict';

  angular.module('esn.oauth-application')
    .config(configBlock);

  function configBlock($stateProvider) {
    $stateProvider
      .state('controlcenter.oauth-application', {
        url: '/oauth-application',
        templateUrl: '/views/modules/oauth-application/oauth-application.html',
        views: {
          'root@controlcenter': {
            template: '<esn-oauth-application-list/>'
          }
        }
      })
      .state('oauth-application', {
        url: '/oauth-application',
        templateUrl: '/views/modules/oauth-application/oauth-application.html',
        deepStateRedirect: {
          default: 'oauth-application.list',
          fn: function() {
            return { state: 'oauth-application.list' };
          }
        }
      })
      .state('oauth-application.list', {
        url: '/list',
        views: {
          'main@oauth-application': {
            template: '<esn-oauth-application-list/>'
          }
        }
      })
      .state('oauth-application.view', {
        url: '/view/:application_id',
        views: {
          'main@oauth-application': {
            template: '<esn-oauth-application-view/>'
          }
        }
      });
    }
})();
