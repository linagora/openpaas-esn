(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .component('profileOverview', {
      templateUrl: '/profile/app/show/overview/profile-overview.html',
      bindings: {
        user: '<',
        me: '<'
      }
    });
})(angular);
