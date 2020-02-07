(function(angular) {
  'use strict';

  angular.module('linagora.esn.profile')
    .component('profileShowDetails', {
      templateUrl: '/profile/app/show/details/profile-show-details.html',
      controller: 'profileShowDetailsController',
      bindings: {
        user: '<'
      }
    });
})(angular);
