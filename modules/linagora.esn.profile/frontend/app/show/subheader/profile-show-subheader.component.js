(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .component('profileShowSubheader', {
      templateUrl: '/profile/app/show/subheader/profile-show-subheader.html',
      bindings: {
        showEditButton: '<'
      }
    });
})(angular);
