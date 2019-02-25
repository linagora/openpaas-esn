'use strict';

angular.module('esn.profile', [])
  .constant('ESN_DEFAULT_PROFILE_AVATAR_SIZE', 256)

  .controller('avatarController', function($scope, $timeout, ESN_DEFAULT_PROFILE_AVATAR_SIZE) {

    $scope.getURL = function() {
      var queryParams = '?size=' + ESN_DEFAULT_PROFILE_AVATAR_SIZE + '&cb=' + Date.now();

      if ($scope.user) {
        return '/api/users/' + $scope.user._id + '/profile/avatar' + queryParams;
      }

      return '/api/user/profile/avatar' + queryParams;
    };

    $scope.avatarURL = $scope.getURL();
    $scope.$on('avatar:updated', function() {
      $timeout(function() {
        $scope.avatarURL = $scope.getURL();
      });
    });
  })

  .directive('profileMinicard', function() {
    return {
      restrict: 'E',
      scope: {
        user: '=',
        label: '@',
        labelclass: '@'
      },
      templateUrl: '/views/modules/profile/profile-minicard.html'
    };
  })

  .directive('userProfileLink', function() {
    return {
      restrict: 'E',
      scope: {
        user: '='
      },
      templateUrl: '/views/modules/profile/user-profile-link.html',
      link: function($scope) {
        if (!$scope.user) {
          $scope.name = '';
        } else if ($scope.user.firstname || $scope.user.lastname) {
          $scope.name = ($scope.user.firstname || '') + ' ' + ($scope.user.lastname || '');
        } else {
          $scope.name = $scope.user.emails[0];
        }
      }
    };
  });
