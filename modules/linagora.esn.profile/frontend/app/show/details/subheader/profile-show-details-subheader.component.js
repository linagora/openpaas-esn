(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .component('profileShowDetailsSubheader', {
      templateUrl: '/profile/app/show/details/subheader/profile-show-details-subheader.html',
      bindings: {
        showEditButton: '<'
      }
    });
})(angular);
