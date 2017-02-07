'use strict';

angular.module('linagora.esn.profile')

  .controller('profileController', function($scope, $state, user, session, _) {
    $scope.user = user;
    $scope.me = session.user._id === $scope.user._id;
    var previousState;

    $scope.$on('$stateChangeSuccess', function(ev, to, toParams, from) {
      if (!_.include(from.name, 'profile.details')) {
        previousState = from.name;
      }
    });

    $scope.back = function() {
      if (previousState) {
        $state.go(previousState);
      } else {
        $state.go('home');
      }
    };
  })
  .controller('profileEditionController', function($scope, $log, user, session, profileAPI, notificationFactory) {
    $scope.user = user;
    $scope.updateProfile = function(user) {
      return profileAPI.updateProfile(user).then(function() {
        return notificationFactory.weakInfo('Profile updated', 'Your profile has been updated');
      }, function(err) {
        $log.error('Error while updating profile', err);
        return notificationFactory.weakError('Error in the profile update', 'Error while updating your profile, please retry later.');
      });
    };
  });
