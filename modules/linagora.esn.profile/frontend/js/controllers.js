'use strict';

angular.module('linagora.esn.profile')

  .controller('profileController', function($scope, esnPreviousPage, user, session) {
    $scope.user = user;
    $scope.me = session.user._id === $scope.user._id;
  })
  .controller('profileOverviewController', function(session) {
    var self = this;

    self.me = self.user._id === session.user._id;
  })
  .controller('profileEditionController', function($scope, $log, $state, user, session, profileAPI, notificationFactory) {
    $scope.user = user;
    $scope.updateProfile = function(user) {
      return profileAPI.updateProfile(user).then(function() {
        session.setUser(user);
        $state.reload();

        return notificationFactory.weakInfo('Profile updated', 'Your profile has been updated');
      }, function(err) {
        $log.error('Error while updating profile', err);

        return notificationFactory.weakError('Error in the profile update', 'Error while updating your profile, please retry later.');
      });
    };
  });
