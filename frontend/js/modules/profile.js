'use strict';

angular.module('esn.profile', ['restangular', 'xeditable', 'openpaas-logo', 'esn.user'])
  .directive('profileDisplay', function() {
    return {
      restrict: 'E',
      scope: {
        user: '='
      },
      templateUrl: '/views/modules/profile/profile.html'
    };
  })

  .directive('profileMinicard', function() {
    return {
      restrict: 'E',
      scope: {
        user: '=',
        label: '@',
        labelclass: '@'
      },
      templateUrl: '/views/modules/profile/minicard.html'
    };
  })

  .controller('profileEditionController', ['$scope', 'profileAPI', 'editableOptions', function($scope, profileAPI, editableOptions) {
    //theming for yes/no buttons in field modification confirmation
    editableOptions.theme = 'bs3';
    var maxNameLength = 100;

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
      ).finally (function() {
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
      );
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
  }])

  .controller('profilecontroller', ['$scope', 'userAPI', function($scope, userAPI) {
    userAPI.currentUser().then(function(response) {
      $scope.user = response.data;
    });
  }])
  .controller('avatarController', ['$rootScope', '$scope', '$timeout', function($rootScope, $scope, $timeout) {

    $scope.getURL = function() {
      return '/api/user/profile/avatar?cb=' + Date.now();
    };

    $scope.avatarURL = $scope.getURL();
    $rootScope.$on('avatar:updated', function() {
      $timeout(function() {
        $scope.avatarURL = $scope.getURL();
        $scope.$apply();
      });
    });
  }]);
