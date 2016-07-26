'use strict';

angular.module('linagora.esn.admin')

.config(function($stateProvider) {
  $stateProvider
    .state('admin', {
      url: '/admin',
      templateUrl: '/admin/views/index',
      controller: 'adminRootController',
      resolve: {
        isAdmin: function($location, session) {
          return session.ready.then(function() {
            if (!session.userIsDomainAdministrator()) { $location.path('/'); }
          });
        }
      }
    })
    .state('admin.dav', {
      url: '/:domainId/dav',
      template: '<admin-dav />'
    })
    .state('admin.ldap', {
      url: '/:domainId/ldap',
      template: '<admin-ldap />'
    });
});
