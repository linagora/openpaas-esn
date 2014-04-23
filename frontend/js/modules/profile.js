'use strict';

angular.module('esn.profile', ['restangular', 'xeditable', 'angularSpinner'])
  .directive('profileDisplay', function() {
    return {
      restrict: 'E',
      scope: {
        user: '='
      },
      templateUrl: '/views/profile/partials/profile.html'
    };
  })

  .controller('profileeditioncontroller', ['$scope', 'profileAPI', 'editableOptions', function($scope, profileAPI, editableOptions) {
    //theming for yes/no buttons in field modification confirmation
    editableOptions.theme = 'bs3';

    $scope.running = {
      name: false,
      job: false,
      service: false,
      building_location: false,
      office_location: false,
      phone: false
    };

    $scope.initFullName = function(firstname, lastname) {
      $scope.fullName = firstname + ' ' + lastname;
      return $scope.fullName;
    };

    var updateField = function(data, runningMarker, fieldName) {
      runningMarker = true;

      return profileAPI.updateProfileField(fieldName, data).then(
        function(data) {
          runningMarker = false;
          return true;
        },
        function(error) {
          runningMarker = false;
          return error.statusText;
        }
      );
    };

    $scope.updateName = function(data) {
      var nameParts = data.split(' ');
      if (nameParts.length < 2) {
        return 'Incorrect Name';
      }
      var firstName = nameParts.shift();
      var lastName = nameParts.join(' ');

      $scope.running.name = true;
      return profileAPI.updateProfileField('firstname', firstName).then(
        function(data) {
          return updateField(lastName, $scope.running.name, 'lastname');
        },
        function(error) {
          $scope.running.name = false;
          return error.statusText;
        }
      );
    };

    $scope.updateJob = function(data) {
      return updateField(data, $scope.running.job, 'job');
    };

    $scope.updateService = function(data) {
      return updateField(data, $scope.running.service, 'service');
    };

    $scope.updateBuildingLocation = function(data) {
      return updateField(data, $scope.running.building_location, 'building_location');
    };

    $scope.updateOfficeLocation = function(data) {
      return updateField(data, $scope.running.office_location, 'office_location');
    };

    $scope.updatePhone = function(data) {
      return updateField(data, $scope.running.phone, 'phone');
    };

  }])

  .factory('profileAPI', ['Restangular', function(Restangular) {
    function updateProfileField(fieldName, fieldValue) {
      var payload = {
        value: fieldValue
      };
      return Restangular.one('user/profile', fieldName).customPUT(payload);
    }

    return {
      updateProfileField: updateProfileField
    };
  }]);
