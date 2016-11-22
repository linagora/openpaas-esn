'use strict';

angular.module('linagora.esn.profile')

  .controller('profileController', function($scope, $window, user, session) {
    $scope.user = user;
    $scope.me = session.user._id === $scope.user._id;
    $scope.back = function() {
      $window.history.back();
    }
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
