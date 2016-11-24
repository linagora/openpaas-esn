'use strict';

angular.module('linagora.esn.profile')

  .directive('profileEditSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/profile/views/partials/profile-edit-subheader.html'
    };
  })

  .directive('profileEditionForm', function() {
    return {
      restrict: 'E',
      templateUrl: '/profile/views/partials/profile-edition-form.html'
    };
  })

  .directive('profileShowSubheader', function() {
    return {
      restrict: 'E',
      templateUrl: '/profile/views/partials/profile-show-subheader'
    }
  })
;
