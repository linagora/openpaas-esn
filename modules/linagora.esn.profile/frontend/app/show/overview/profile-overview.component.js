(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .component('profileOverview', {
      templateUrl: '/profile/app/show/overview/profile-overview.html',
      controller: 'profileOverviewController',
      bindings: {
        user: '<',
        me: '<',
        canEdit: '<'
      }
    });
})(angular);
