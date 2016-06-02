'use strict';

angular.module('linagora.esn.profile')

  .controller('profileController', function($scope, user, session, profileAPI) {
    var maxNameLength = 100;

    $scope.user = user;
    $scope.me = session.user._id === $scope.user._id;
    $scope.running = {
      name: false,
      job: false,
      service: false,
      building_location: false,
      office_location: false,
      phone: false
    };

    $scope.initFullName = function(firstname, lastname) {
      if (firstname && lastname) {
        $scope.fullName = firstname + ' ' + lastname;
      }

      return $scope.fullName;
    };

    var updateField = function(data, runningMarker, fieldName) {
      $scope.running[runningMarker] = true;

      return profileAPI.updateProfileField(fieldName, data).then(
        function(data) {
          $scope.running[runningMarker] = false;

          return true;
        },
        function(error) {
          $scope.running[runningMarker] = false;

          return error.statusText;
        }
      ).finally(function() {
        $scope.running[runningMarker] = false;
      });
    };
  })
  .controller('profileEditionController', function($scope, user, session, profileAPI, notificationFactory) {
    $scope.user = user;
    $scope.updateProfile = function(user) {
      return profileAPI.updateProfile(user).then(
        function(data) {
          return notificationFactory.weakInfo('Profile updated', 'Your profile has been updated');
        },
        function(error) {
          return notificationFactory.weakError('Error in the profile update', 'Error while updating your profile, please retry later.');
        }
      );
    };
  });
