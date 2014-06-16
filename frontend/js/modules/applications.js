'use strict';

angular.module('esn.applications', ['esn.session'])
  .controller('applicationsController', ['$scope', '$log', 'session', 'applicationsAPI', 'applications', function($scope, $log, session, applicationsAPI, applications) {
    $scope.applications = applications;
    $scope.client = {};

    $scope.create = function(client) {
      applicationsAPI.create(client).then(function(response) {
        $log.debug('Successfully POST new client', client, response);
      });
    };
  }])
  .directive('applicationDisplay', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/applications/application-display.html'
    };
  })
  .directive('applicationAddForm', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/applications/application-add-form.html'
    };
  })
  .factory('applicationsAPI', ['Restangular', function(Restangular) {

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
