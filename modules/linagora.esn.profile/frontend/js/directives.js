'use strict';

angular.module('linagora.esn.profile')

  .directive('controlcenterMenuProfile', function(controlCenterMenuTemplateBuilder) {
    return {
      restrict: 'E',
      template: controlCenterMenuTemplateBuilder('controlcenter.profile', 'mdi-account', 'Profile')
    };
  })

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
  });
