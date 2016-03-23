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

    $scope.updateName = function(data) {
      var nameParts = data.split(' ');

      if (nameParts.length < 2) {
        return 'Incorrect Name';
      }
      var firstName = nameParts.shift();
      var lastName = nameParts.join(' ');

      if (firstName.length > maxNameLength) {
        return 'First name is too long';
      }
      if (lastName.length > maxNameLength) {
        return 'Last name is too long';
      }

      $scope.running.name = true;

      return profileAPI.updateProfileField('firstname', firstName).then(
        function(data) {
          $scope.running.name = false;

          return updateField(lastName, $scope.running.name, 'lastname');
        },
        function(error) {
          $scope.running.name = false;

          return error.statusText;
        }
      ).finally(function() {
        $scope.$emit('username:updated');
      });
    };

    $scope.updateJob = function(data) {
      return updateField(data, 'job', 'job_title');
    };

    $scope.updateService = function(data) {
      return updateField(data, 'service', 'service');
    };

    $scope.updateBuildingLocation = function(data) {
      return updateField(data, 'building_location', 'building_location');
    };

    $scope.updateOfficeLocation = function(data) {
      return updateField(data, 'office_location', 'office_location');
    };

    $scope.updatePhone = function(data) {
      return updateField(data, 'phone', 'main_phone');
    };

  });
