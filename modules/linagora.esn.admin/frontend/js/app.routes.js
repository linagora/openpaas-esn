'use strict';

angular.module('linagora.esn.admin')

.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.when('/admin', function($state, $location, session) {
    session.ready.then(function() {
      if (!session.userIsDomainAdministrator()) {
        return $location.path('/');
      }

      var domainId = session.domain._id; // we suppose that an admin manages only 1 domain

      $state.go('admin.domain', { domainId: domainId });
    });
  });

  $stateProvider
    .state('admin', {
      url: '/admin',
      templateUrl: '/admin/views/index',
      resolve: {
        isAdmin: function($location, session) {
          return session.ready.then(function() {
            if (!session.userIsDomainAdministrator()) { $location.path('/'); }
          });
        }
      }
    })
    .state('admin.domain', {
      url: '/:domainId',
      template: '<ui-view noanimation="noanimation" />',
      deepStateRedirect: {
        default: 'admin.domain.dav',
        params: true,
        fn: function() {
          return { state: 'admin.domain.dav' };
        }
      }
    })
    .state('admin.domain.dav', {
      url: '/dav',
      template: '<admin-dav />'
    })
    .state('admin.domain.ldap', {
      url: '/ldap',
      template: '<admin-ldap />'
    });
});
