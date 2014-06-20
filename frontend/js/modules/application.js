'use strict';

angular.module('esn.application', ['restangular'])
  .controller('applicationController', ['$scope', '$log', '$location', 'applicationAPI', 'applications', function($scope, $log, $location, applicationAPI, applications) {
    $scope.applications = applications;
    $scope.sending = false;
    $scope.client = {};

    $scope.create = function(client) {
      if (!client) {
        $log.error('Client is required');
        return;
      }
      $scope.sending = true;
      applicationAPI.create(client).then(function(response) {
        $log.debug('Successfully created new client', client, response);
        $location.path('/applications/' + response.data._id);
      }, function(err) {
        $log.error('Error while creating new client', err.data);
        $scope.sending = false;
      });
    };
  }])
  .controller('applicationDetailsController', ['$scope', '$log', 'applicationAPI', 'application', function($scope, $log, applicationAPI, application) {
    $scope.client = application;
    $scope.sending = false;

    $scope.revokeTokens = function() {
      $log.debug('Revoke tokens for client', $scope.client);
    };
    $scope.resetClientSecret = function() {
      $log.debug('Reset client secret for client', $scope.client);
    };
    $scope.update = function() {
      $log.debug('Update client', $scope.client);
    };
    $scope.delete = function() {
      $log.debug('Delete client', $scope.client);
    };
  }])
  .directive('applicationDisplay', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/application/application-display.html'
    };
  })
  .directive('applicationAddForm', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/application/application-add-form.html'
    };
  })
  .directive('applicationEditForm', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/application/application-edit-form.html'
    };
  })
  .factory('applicationAPI', ['Restangular', function(Restangular) {

    function get(id) {
      return Restangular.one('oauth/clients', id).get();
    }

    function create(client) {
      return Restangular.all('oauth/clients').post(client);
    }

    function list() {
      return Restangular.all('oauth/clients').getList();
    }

    function remove(id) {
      return Restangular.one('oauth/clients', id).remove();
    }

    return {
      list: list,
      get: get,
      create: create,
      remove: remove
    };
  }]);
