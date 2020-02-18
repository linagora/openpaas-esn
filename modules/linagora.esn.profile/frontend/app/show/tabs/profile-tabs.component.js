(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .component('profileTabs', {
      templateUrl: '/profile/app/show/tabs/profile-tabs.html',
      controller: 'profileTabsController',
      bindings: {
        user: '<',
        me: '<',
        canEdit: '<'
      }
    });
})(angular);
